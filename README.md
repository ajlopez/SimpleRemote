# SimpleRemote

Simple Remote Object implementation. It wraps up a Javascript object to use it from other process.

## Installation

Via npm on Node:

```
npm install simpleremote
```

## Usage

Reference it from your program:

```js
var simpleremote = require('simpleremote');
```

Declare and expose an object using a server:
```js
var obj = {
    add: function(x,y) { 
        return x + y;
    }
};

var server = simpleremote.createRemoteServer(obj);
server.listen(port);
```

Consuming the remote object from a client:
```js
var client = simpleremote.createRemoteClient();
client.on('remote', function (remote) { // receives an proxy object to remote object
    remote.add(1, 2, function (err, value) {
       console.log(value); // prints 3
    };
});
client.connect(port, host);
```

Declare and expose an object using a client:
```js
var obj = {
    add: function(x,y) { 
        return x + y;
    }
};

var client = simpleremote.createRemoteClient(obj);
client.connect(port, host);
```

Consuming the remote object from a server:
```js
var server = simpleremote.createRemoteServer();
server.on('remote', function (remote) { // receives an proxy object to remote object at client connection
    remote.add(1, 2, function (err, value) {
       console.log(value); // prints 3
    };
});
server.listen(port);
```
You can combine both methods.

If the remote method to invoke has a callback as last parameter, you must declare its name at exposing the object:

```js
var obj = {
    addAsync: function(x,y, cb) { 
        // ...
        cb(null, x + y);
    }
};

var client = simpleremote.createRemoteClient(obj, ['addAsync']);
```
```js
var obj = {
    addAsync: function(x,y, cb) { 
        // ...
        cb(null, x + y);
    }
};

var server = simpleremote.createRemoteServer(obj, ['addAsync']);
```

TBD: Registry support.


## Development

```
git clone git://github.com/ajlopez/SimpleRemote.git
cd SimpleRemote
npm install
npm test
```

## Versions

- 0.0.1: Published
- 0.0.2: Published. Refactored to use SimpleMessages 0.0.3
- 0.0.3: Published.
Adding support for call remote async methods (methods that accept a
callback function as end argument).
Updated README.md
- 0.0.4: Published. Using SimpleMessages 0.0.5; updated engine range
- 0.0.5: Published. Using SimpleMessages 0.0.6; silent error in server if error in client socket

## Used by

- [SimpleQueue](https://github.com/ajlopez/SimpleQueue) 
Simple in-memory Queue for Node.js. It can be used from remote clients.

## Contribution

Feel free to [file issues](https://github.com/ajlopez/SimpleRemote) and submit
[pull requests](https://github.com/ajlopez/SimpleRemote/pulls) — contributions are
welcome.

If you submit a pull request, please be sure to add or update corresponding
test cases, and ensure that `npm test` continues to pass.

