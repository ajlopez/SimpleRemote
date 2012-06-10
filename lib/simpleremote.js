
var simplemessages = require('simplemessages'),
    util = require('util');
    
function Remote(obj)
{
    events.EventEmitter.call(this);
    var self = this;
    
    this.processMessage = function(msg, channel) {
        try {
            var value;
            
            if (isRemote(msg)) {
                value = unmarshall(msg.methods, channel, msg.refid);
                this.emit('remote', value);
                return;
            }
            
            if (isCall(msg)) {
                if (msg.refid)
                {
                    var element = obj.getElement(msg.refid);
                    value = element[msg.name].apply(element, msg.args);
                }
                else    
                    value = obj[msg.name].apply(obj, msg.args);
                    
                if (hasReply(msg))
                    channel.write( { resid: msg.resid, value: value } );
                    
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
            if (hasReply(msg))
                channel.write( { resid: msg.resid, err: ex.toString() } );
        }
    }
}

util.inherits(Remote, process.EventEmitter);

function RemoteServer(obj)
{
    Remote.call(this, obj);
    var reference;
    var self = this;
    
    if (obj)
        reference = marshall(obj);
    
	var server = simplemessages.createServer(function(channel) {
        if (reference)
            channel.on('connect', function() {
                channel.write(reference);
            });
        
		channel.on('message', function(msg) {
            try {
                var value;
                
                if (msg.refid)
                {
                    var element = obj.getElement(msg.refid);
                    value = element[msg.name].apply(element, msg.args);
                }
                else    
                    value = obj[msg.name].apply(obj, msg.args);
                    
                if (msg.resid)
                    channel.write( { resid: msg.resid, value: value } );
            }
            catch (ex) {
                if (msg.resid)
                    channel.write( { resid: msg.resid, err: ex.toString() } );
            }
		});
        
        // TODO review
		channel.on('end', function() {
		});
		channel.on('close', function() {
		});
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

function RemoteClient(callback) {
    events.EventEmitter.call(this);
    var self = this;
    var channel;
    
    this.on('remote', callback);
    
    this.connect = function(port, host) {
        channel = simplemessages.createClient();
        
        channel.on('message', function(msg) {
            var value = msg.value;
            
            // Remote object
            if (msg.methods) {
                value = unmarshall(msg.methods, channel);
                if (msg.refid)
                    value.refid = msg.refid;
            }
            // Returned value is an object
            else if (msg.resid && msg.value && msg.value.methods && msg.value.refid) {
                value = unmarshall(msg.value.methods, channel);
                value.refid = msg.value.refid;
            }
            
            if (msg.resid) {
                var cb = responsescb[msg.resid];
                delete responsescb[msg.resid];
                if (cb.length == 2)
                    if (msg.err)
                        cb(msg.err);
                    else
                        cb(null, value);
                else
                    cb(value);
            }
            else
                self.emit('remote', value);            
        });
        
        channel.on('end', function() { self.emit('end'); });
        channel.on('close', function() { self.emit('close'); });
        channel.connect(port, host);
    }
    
    this.end = function()
    {
        if (channel)
            channel.end();
    }
}

util.inherits(RemoteClient, process.EventEmitter);

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

function Registry(obj)
{
    this.getReference = function(name) {
        if (obj[name] == null)
            return null;
            
        var reference = marshall(obj[name]);
        reference.refid = name;
        
        return reference;
    };
    
    this.getElement = function(name) {
        return obj[name];
    };
}

exports.createRemoteServer = function(obj) {
    return new RemoteServer(obj);
}

exports.createRemoteClient = function(port, host) {
    return new RemoteClient(port, host);
}

exports.createRegistry = function(obj) {
    return new Registry(obj);
}

