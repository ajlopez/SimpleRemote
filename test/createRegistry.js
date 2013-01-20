
var simpleremote = require('../');

var obj = {
    add: function (x, y) { return x + y; },
    description: 'an Object',
    values: [1,2,3],
    customer: { 
        id: 1, 
        name: 'Google', 
        add: function(x, y) { return x + y },
        addAsync: function (x, y, cb) { cb(null, x + y); }
    }
};

var registry = simpleremote.createRegistry(obj, ['addAsync']);

exports['Get Registry'] = function(test) {
    test.expect(1);
    
    var server = simpleremote.createRemoteServer(registry);
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient();
    
    client.on('remote', 
        function(remote) {
            test.ok(remote);
            server.close();
            client.end();
            test.done();
        });
        
    client.connect(3000);
}

exports['Get String Element'] = function(test) {
    test.expect(4);
    
    var server = simpleremote.createRemoteServer(registry);
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient();
    
    client.on('remote',
        function(remote) {
            test.ok(remote);
            remote.getElement('description', function(element) {
                test.ok(element);
                test.equal(typeof element, 'string');
                test.equal(element, 'an Object');
                server.close();
                client.end();
                test.done();
            });
        });
        
    client.connect(3000);
}

exports['Get Array Element'] = function(test) {
    test.expect(7);
    
    var server = simpleremote.createRemoteServer(registry);
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient();
    
    client.on('remote',
        function(remote) {
            test.ok(remote);
            remote.getElement('values', function(element) {
                test.ok(element);
                test.ok(Array.isArray(element));
                test.equal(element.length, 3);
                test.equal(element[0], 1);
                test.equal(element[1], 2);
                test.equal(element[2], 3);
                server.close();
                client.end();
                test.done();
            });
        });
        
    client.connect(3000);
}

exports['Get Object Element'] = function(test) {
    test.expect(5);
    
    var server = simpleremote.createRemoteServer(registry);
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient();
    
    client.on('remote',
        function(remote) {
            test.ok(remote);
            remote.getElement('customer', function(element) {
                test.ok(element);
                test.equal(typeof element, 'object');
                test.equal(element.id, 1);
                test.equal(element.name, 'Google');
                server.close();
                client.end();
                test.done();
            });
        });
        
    client.connect(3000);
}

exports['Get Undefined Element as null'] = function(test) {
    test.expect(2);
    
    var server = simpleremote.createRemoteServer(registry);
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient();
    
    client.on('remote',
        function(remote) {
            test.ok(remote);
            remote.getElement('foo', function(element) {
                test.equal(element, null);
                server.close();
                client.end();
                test.done();
            });
        });
        
    client.connect(3000);
}

exports['Get Reference'] = function(test) {
    test.expect(6);
    
    var server = simpleremote.createRemoteServer(registry);
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient();
    
    client.on('remote', 
        function(remote) {
            test.ok(remote);
            remote.getReference('customer', function(element) {
                test.ok(element);
                test.equal(typeof element, 'object');
                test.equal(element.id, null);
                test.equal(element.name, null);
                test.ok(element.add);
                server.close();
                client.end();
                test.done();
            });
        });
        
    client.connect(3000);
}

exports['Invoke Reference Method'] = function(test) {
    test.expect(2);
    
    var server = simpleremote.createRemoteServer(registry);
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient();
    
    client.on('remote',
        function(remote) {
            test.ok(remote);
            remote.getReference('customer', function(element) {
                element.add(1, 2, function(value) {
                    test.equal(value, 3);
                    server.close();
                    client.end();
                    test.done();
                });
            });
        });
        
    client.connect(3000);
}


exports['Invoke Async Reference Method'] = function(test) {
    test.expect(2);
    
    var server = simpleremote.createRemoteServer(registry);
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient();
    
    client.on('remote',
        function(remote) {
            test.ok(remote);
            remote.getReference('customer', function(element) {
                element.addAsync(1, 2, function(value) {
                    test.equal(value, 3);
                    server.close();
                    client.end();
                    test.done();
                });
            });
        });
        
    client.connect(3000);
}
