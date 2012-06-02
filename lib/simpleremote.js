
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
            console.log('message');
            console.log(JSON.stringify(msg));
            console.log('name ' + msg.name);
            obj[msg.name](obj, msg.args);
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

function RemoteClient(port, host) {
    events.EventEmitter.call(this);
    var self = this;
    var channel = simplemessages.createClient(port, host);
    
    channel.on('message', function(msg) {
        console.log('Message : ' + JSON.stringify(msg));
        if (msg.methods) {
            var remote = unmarshall(msg.methods, channel);
            self.emit('remote', remote);
        }
    });
    
    this.end = function()
    {
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
        console.log('mthname ' + mthname);
        obj[mthname] = makeFunction(mthname, channel);
    }
    
    function makeFunction(mthname, channel) {
        return function() { channel.write({ name: mthname, args: arguments }); }
    }
    
    return obj;
}

exports.createRemoteServer = function(obj) {
    return new RemoteServer(obj);
}

exports.createRemoteClient = function(port, host) {
    return new RemoteClient(port, host);
}

