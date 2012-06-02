
var simplemessages = require('simplemessages'),
    util = require('util');

function RemoteServer(obj)
{
    events.EventEmitter.call(this);
    var reference = marshall(obj);
    
	var server = simplemessages.createServer(function(channel) {
		channel.on('connect', function() {
            channel.write(reference);
		});
        
		channel.on('message', function(msg) {
            obj[msg.name].apply(obj, msg.args);
		});
        
		channel.on('end', function() {
		});
	});
    
	this.listen = function(port, host) {
        server.listen(port, host);
    }
    
    this.close = function() {
        server.close();
    }
}

util.inherits(RemoteServer, process.EventEmitter);

function RemoteClient(callback) {
    events.EventEmitter.call(this);
    var self = this;
    var channel;
    
    this.on('remote', callback);
    
    this.connect = function(port, host) {
        channel = simplemessages.createClient(port, host);
        
        channel.on('message', function(msg) {
            if (msg.methods) {
                var remote = unmarshall(msg.methods, channel);
                self.emit('remote', remote);
            }
        });
        
        channel.on('end', function() { self.emit('end'); });
    }
    
    this.end = function()
    {
        if (channel)
            channel.end();
    }
}

util.inherits(RemoteClient, process.EventEmitter);

function marshall(obj)
{
    var methods = [];
    
    for (var n in obj)
        if (typeof obj[n] == 'function')
            methods.push(n);
    
    return { methods: methods };
}

function unmarshall(methods, channel)
{
    var obj = {};
    
    for (var n in methods) {
        var mthname = methods[n];
        obj[mthname] = makeFunction(mthname, channel);
    }
    
    function makeFunction(mthname, channel) {
        return function() { channel.write({ name: mthname, args: asArray(arguments) }); }
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

exports.createRemoteServer = function(obj) {
    return new RemoteServer(obj);
}

exports.createRemoteClient = function(port, host) {
    return new RemoteClient(port, host);
}

