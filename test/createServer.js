
var simpleremote = require('../');

var obj = {
    add: function (x, y) { return x + y; }
};

exports['Create Server'] = function(test) {
    test.expect(1);
    
    var server = simpleremote.createRemoteServer(obj);
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

exports['Create and Invoke Server'] = function(test) {
    test.expect(2);
    
    var obj = {
        method: function (x) { 
            test.equal(x, 1); 
            test.done(); 
        }
    };

    var server = simpleremote.createRemoteServer(obj);
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient();
    
    client.on('remote',
        function(remote) {
            test.ok(remote);
            remote.method(1);
            server.close();
            client.end();
        });
        
    client.connect(3000);
}

exports['Invoke Remote Method and Get Simple Return'] = function(test) {
    test.expect(3);
    
    var obj = {
        add: function(x,y) { 
            return x + y;
        }
    };

    var server = simpleremote.createRemoteServer(obj);
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient();
    
    client.on('remote',
        function(remote) {
            test.ok(remote);
            remote.add(2, 3, function(val) {
                test.ok(val);
                test.equal(val, 5);
                server.close();
                client.end();
                test.done();
            });
        });
        
    client.connect(3000);
}

exports['Throw error in callback'] = function(test) {
    test.expect(3);
    
    var obj = {
        add: function(x,y) { 
            return x + y;
        }
    };

    var server = simpleremote.createRemoteServer(obj);
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient();
    
    client.on('remote',
        function(remote) {
            test.ok(remote);
            remote.add(2, 3, function(val) {
                throw "problem";
            });
            remote.add(2, 3, function(val) {
                test.ok(val);
                test.equal(val, 5);
                server.close();
                client.end();
                test.done();
            });
        });
        
    client.connect(3000);
}

exports['Get Simple Return without Error'] = function(test) {
    test.expect(3);
    
    var obj = {
        add: function(x,y) { 
            return x + y;
        }
    };

    var server = simpleremote.createRemoteServer(obj);
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient();
    
    client.on('remote',
        function(remote) {
            test.ok(remote);
            remote.add(2, 3, function(err, val) {
                test.ok(val);
                test.equal(val, 5);
                server.close();
                client.end();
                test.done();
            });
        });
        
    client.connect(3000);
}

exports['Get Simple Return using Remote Callback'] = function(test) {
    test.expect(3);
    
    var obj = {
        add: function(x,y,cb) { 
            cb(null, x + y);
        }
    };

    var server = simpleremote.createRemoteServer(obj, ['add']);
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient();
    
    client.on('remote',
        function(remote) {
            test.ok(remote);
            remote.add(2, 3, function(err, val) {
                test.ok(val);
                test.equal(val, 5);
                server.close();
                client.end();
                test.done();
            });
        });
        
    client.connect(3000);
}

exports['Get Remote Error'] = function(test) {
    test.expect(4);
    
    var obj = {
        eval: function(text) { 
            return eval(text);
        }
    };

    var server = simpleremote.createRemoteServer(obj);
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient();
    
    client.on('remote',
        function(remote) {
            test.ok(remote);
            remote.eval("a+2", function(err, val) {
                test.ok(err);
                test.ok(typeof err == 'string');
                test.ok(err.indexOf('ReferenceError') >= 0);
                server.close();
                client.end();
                test.done();
            });
        });
        
    client.connect(3000);
}

exports['Get Remote Error using Callback'] = function(test) {
    test.expect(4);
    
    var obj = {
        eval: function(text, cb) { 
            cb(eval(text));
        }
    };

    var server = simpleremote.createRemoteServer(obj, ['eval']);
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient();
    
    client.on('remote',
        function(remote) {
            test.ok(remote);
            remote.eval("a+2", function(err, val) {
                test.ok(err);
                test.ok(typeof err == 'string');
                test.ok(err.indexOf('ReferenceError') >= 0);
                server.close();
                client.end();
                test.done();
            });
        });
        
    client.connect(3000);
}

exports['Remote Simple Eval'] = function(test) {
    test.expect(3);
    
    var obj = {
        eval: function(text) { 
            return eval(text);
        }
    };

    var server = simpleremote.createRemoteServer(obj);
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient();
    
    client.on('remote',
        function(remote) {
            test.ok(remote);
            remote.eval("2+3", function(val) {
                test.ok(val);
                test.equal(val, 5);
                server.close();
                client.end();
                test.done();
            });
        });
        
    client.connect(3000);
}

exports['Serialize Simple Object'] = function(test) {
    test.expect(4);
    
    var obj = {
        get: function(name) { 
            return { name: name, length: name.length };
        }
    };

    var server = simpleremote.createRemoteServer(obj);
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient();
    
    client.on('remote',
        function(remote) {
            test.ok(remote);
            remote.get("foo", function(val) {
                test.ok(val);
                test.equal(val.name, "foo");
                test.equal(val.length, 3);
                server.close();
                client.end();
                test.done();
            });
        });
        
    client.connect(3000);
}

exports['Serialize null'] = function(test) {
    test.expect(2);
    
    var obj = {
        get: function(name) { 
            return null;
        }
    };

    var server = simpleremote.createRemoteServer(obj);
    server.listen(3000);
    
    var client = simpleremote.createRemoteClient();
    
    client.on('remote',
        function(remote) {
            test.ok(remote);
            remote.get("foo", function(val) {
                test.equal(val, null);
                server.close();
                client.end();
                test.done();
            });
        });
        
    client.connect(3000);
}
