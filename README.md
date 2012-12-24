Hostess is a nice girl that will run your async code based on
dependencies. 

## Basic Usage

Calling `hostess()` returns a method that you can call repeatedly.
You pass in a name, an optional list of dependencies, and a callback.

The callback will not be called until it's dependcies have been met.

```javascript
var hostess = require('hostess')
  , host = hostess()

host('first', function() {
  console.log('first');
});

host('second', ['first'], function() {
  console.log('first');
});
```

## Asynchronous

To use hostess asyncronously, just ask nicely for a callback, and she
won't run any dependencies until you call it.

```javascript
var hostess = require('hostess')
  , host = hostess()

host('first', function(next) {
  setTimeout(function() {
    console.log('first');
    next();
  }, 10);
});

host('second', ['first'], function() {
  console.log('first');
});
```

## Event Handlers

There are two special names you can give to hostess, `'error'`, and
`'done'`, which will act as event handlers and not dependencies.

```javscript
var hostess = require('hostess')
  , host = hostess()

// if you don't set and error handler, then
// errors will be uncaught exceptions.
host('error', function(err) {
  console.log('you got an error: ' + err.message);
});

host('bad', function() {
  throw new Error('oh noes');
});

host('bad', function(next) {
  next(new Error('oh noes'));
});
```

```javascript
var hostess = require('hostess')
  , host = hostess()

host('done', function() {
  // nothing left in the queue
});

host('no deps', function() {
  // done will be fired after this
});

host('cookies', ['milk'], function() {
  // done will be fired after this
});

host('milk', function() {
  // won't fire done
});
```
