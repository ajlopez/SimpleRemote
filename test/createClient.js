
var simpleremote = require('../');

var obj = {
    add: function (x, y) { return x + y; }
};

exports['Create Client with Remote Object']= function(test) {
    test.expect(2);
    
    var server = simpleremote.createRemoteServer(obj);
    server.on('remote', function(remote) { remote.process('foo'); });
    server.listen(3000);
    
    var obj = {
        process: function(msg) {
            test.ok(msg);
            test.equal(msg, 'foo');
            server.close();
            client.end();
            test.done();
        }
    }
    
    var client = simpleremote.createRemoteClient(obj);
        
    client.connect(3000);
}
