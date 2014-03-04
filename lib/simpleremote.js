
var simplemessages = require('simplemessages'),
    events = require('events'),
    net = require('net'),
    util = require('util');
    
function Remote(obj, asyncs)
{
    events.EventEmitter.call(this);
    var self = this;
    
    this.processMessage = function(msg, channel) {
        try {
            var value, target, isasync;
            
            if (isRemote(msg)) {
                value = unmarshall(msg.methods, channel, msg.refid);
                this.emit('remote', value);
                return;
            }
            
            if (isCall(msg)) {
                if (msg.refid) {
                    target = obj.getElement(msg.refid);
                    isasync = obj.isAsync(msg.name);
                }
                else {
                    target = obj;
                    if (asyncs && asyncs.indexOf(msg.name) >= 0)
                        isasync = true;
                }

                if (isasync) {
                    var args = msg.args ? msg.args : [];
                    if (hasReply(msg))
                        args.push(function (err, value) {
                            if (err)
                                channel.write( { resid: msg.resid, err: err } );
                            else
                                channel.write( { resid: msg.resid, value: value } );
                        });
                    else
                        args.push(function (err, msg) { });

                    target[msg.name].apply(target, args);
                } 
                else {
                    value = target[msg.name].apply(target, msg.args);
                        
                    if (hasReply(msg))
                        channel.write( { resid: msg.resid, value: value } );
                }
                    
                return;
            }
            
            if (isResponse(msg)) {
                value = msg.value;
                
                if (isRemote(value))
                    value = unmarshall(value.methods, channel, value.refid);
                
                var cb = responsescb[msg.resid];
                delete responsescb[msg.resid];
                
                if (cb.length == 2)
                    if (msg.err)
                        cb(msg.err);
                    else
                        cb(null, value);
                else
                    cb(value);
                    
                return;
            }
            
            this.emit('message', msg);
        }
        catch (ex) {
            if (isCall(msg) && hasReply(msg))
                channel.write( { resid: msg.resid, err: ex.toString() } );
        }
    }
}

util.inherits(Remote, process.EventEmitter);

function RemoteServer(obj, asyncs)
{
    Remote.call(this, obj, asyncs);
    var reference;
    var self = this;
    
    if (obj)
        reference = marshall(obj);
    
	var server = simplemessages.createServer(function(channel) {
        if (reference)
            channel.write(reference);
        
		channel.on('data', function(msg) {
            self.processMessage(msg, channel);
		});
        
		channel.on('end', function() { self.emit('end'); });
		channel.on('close', function() { self.emit('close'); });
		channel.on('error', function(err) { /*self.emit('error', err);*/ });
	});
    
	this.listen = function(port, host) {
        server.listen(port, host);
    }
    
    this.close = function() {
        server.close();
    }
}

util.inherits(RemoteServer, Remote);

function isRemote(msg)
{
    return msg != null && msg.methods != null;
}

function isCall(msg)
{
    return msg != null && msg.name != null;
}

function isResponse(msg)
{
    return msg != null && msg.resid != null;
}

function hasReply(msg)
{
    return msg != null && msg.resid != null;
}

function RemoteClient(obj, asyncs) {
    Remote.call(this, obj, asyncs);
    var self = this;
    var channel;
    var reference;
    
    if (obj)
        reference = marshall(obj);
    
    this.connect = function(port, host) {
        channel = simplemessages.createClient(port, host, function() { if (reference) channel.write(reference); });
        
        channel.on('data', function(msg) {
            self.processMessage(msg, channel);
        });
        
        channel.on('end', function() { self.emit('end'); });
        channel.on('error', function(err) { self.emit('error', err); });
        channel.on('close', function() { self.emit('close'); });
    }
    
    this.end = function()
    {
        if (channel)
            channel.end();
    }
}

util.inherits(RemoteClient, Remote);

var maxresid = 0;
var responsescb = {};

function marshall(obj)
{
    var methods = [];
    
    for (var n in obj)
        if (typeof obj[n] == 'function')
            methods.push(n);
    
    return { methods: methods };
}

function unmarshall(methods, channel, refid)
{
    var obj = {};
    
    if (refid)
        obj.refid = refid;
    
    for (var n in methods) {
        var mthname = methods[n];
        obj[mthname] = makeFunction(mthname, channel);
    }
    
    function makeFunction(mthname, channel) {
        return function() { 
            var args = asArray(arguments);
            var responseid;
          
            // last argument is a callback
            
            if (args && args.length > 0 && typeof args[args.length-1] == 'function')
            {
                maxresid++;
                responseid = maxresid;
                responsescb[responseid] = args[args.length-1];
                args = args.slice(0, args.length-1);
            }
            
            var msg = {
                name: mthname,
                args: args
            };
            
            if (responseid)
                msg.resid = responseid;
                
            if (this.refid)
                msg.refid = this.refid;
            
            channel.write(msg); 
        }
    }
    
    return obj;
}

// Hack: function receives an array-like object but apply expects an array

function asArray(obj)
{
    if (Array.isArray(obj))
        return obj;
        
    var result = [];
    
    for (var n in obj)
        result[parseInt(n)] = obj[n];
        
    return result;
}

function Registry(obj, asyncs)
{
    this.getReference = function(name) {
        if (obj[name] == null)
            return null;
            
        var reference = marshall(obj[name]);
        reference.refid = name;
        
        return reference;
    };
    
    this.getElement = function (name) {
        return obj[name];
    };

    this.isAsync = function (mthname) {
        if (!asyncs)
            return false;

        return asyncs.indexOf(mthname) >= 0;
    }
}

exports.createRemoteServer = function(obj, asyncs) {
    return new RemoteServer(obj, asyncs);
}

exports.createRemoteClient = function(obj, asyncs) {
    return new RemoteClient(obj, asyncs);
}

exports.createRegistry = function(obj, asyncs) {
    return new Registry(obj, asyncs);
}

exports.marshall = marshall;

