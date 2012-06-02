
var simpleremote = require('../');

var obj = {
    add: function (x, y) { return x + y; }
};

simpleremote.createRemoteServer(obj);

exports['Create Server'] = function(test) {
    test.expect(1);
    
    var server = simpleremote.createRemoteServer(obj);
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient(
        function(remote) {
            test.ok(remote);
            server.close();
            client.end();
            test.done();
        });
        
    client.connect(3000);
}

exports['Create and Invoke Server'] = function(test) {
    test.expect(2);
    
    var obj = {
        method: function (x) { 
            test.equal(x, 1); 
            test.done(); 
        }
    };

    var server = simpleremote.createRemoteServer(obj);
    server.listen(3001);
    
    var client = simpleremote.createRemoteClient(
        function(remote) {
            test.ok(remote);
            remote.method(1);
            server.close();
            client.end();
        });
        
    client.connect(3001);
}
