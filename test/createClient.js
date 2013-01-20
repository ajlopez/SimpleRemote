
var simpleremote = require('../');

var obj = {
    add: function (x, y) { return x + y; }
};

exports['Create Client with Remote Object']= function(test) {
    test.expect(2);
    
    var obj = {
        process: function(msg) {
            test.ok(msg);
            test.equal(msg, 'foo');
            server.close();
            client.end();
            test.done();
        }
    }
    
    var server = simpleremote.createRemoteServer();
    server.on('remote', function(remote) { remote.process('foo'); });
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient(obj);
        
    client.connect(3000);
}

exports['Create Client with Remote Object and Callback']= function(test) {
    test.expect(4);
    
    var obj = {
        process: function(msg, cb) {
            test.ok(msg);
            test.equal(msg, 'foo');
            cb(null, 'bar');
        }
    }
    
    var server = simpleremote.createRemoteServer();

    server.on('remote', function(remote) { 
        remote.process('foo', function (err, msg) {
            test.ok(msg);
            test.equal(msg, 'bar');
            server.close();
            client.end();
            test.done();
        });
    });
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient(obj, ['process']);
        
    client.connect(3000);
}
