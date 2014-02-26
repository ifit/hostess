var hostess = require('./index')
  , assert  = require('assert')
  ;

describe('host some functions', function() {

  it('should fire a function with no deps', function(done) {
    var host = hostess();

    host('nodeps', [], function() {
      done();
    });
  });

  it('should not require a deps arg', function(done) {
    var host = hostess();

    host('nodeps', function() {
      done();
    });
  });

  it('should fire a method after its dep is met', function(done) {
    var host = hostess();
    var firstDone = false;

    host('second', ['first'], function() {
      assert.ok(firstDone);
      done();
    });

    host('first', function() {
      firstDone = true;
    });
  });

  it('should never fire a method if its deps arent met', function(done) {
    var host = hostess();

    host('never', ['doesnt exist'], function(next) {
      throw new Error('doesnt exist');
    });

    setTimeout(done, 10);
  });

  it('should fire a method if its dep is already met', function(done) {
    var host = hostess();
    var firstDone = false;

    host('first', function() {
      firstDone = true;
    });

    host('second', ['first'], function() {
      assert.ok(firstDone);
      done();
    });
  });

  it('should work with many dependencies', function(done) {
    var host = hostess();

    host('king', ['queen', 'rook', 'bishop', 'knight', 'pawn'], function() {
      done();
    });

    host('queen', ['rook'], function() {})
    host('rook', ['bishop', 'knight'], function() {})
    host('bishop', ['pawn'], function() {})
    host('knight', ['pawn'], function() {})
    host('pawn', function() {})

  });

});

describe('host some functions async', function() {

  it('should fire a function with no deps async', function(done) {
    var host = hostess();

    host('nodeps', [], function(next) {
      next();
      done();
    });
  });

  it('should not require a deps arg async', function(done) {
    var host = hostess();

    host('nodeps', function(next) {
      next();
      done();
    });
  });

  it('should fire a method after its dep is met async', function(done) {
    var host = hostess();
    var firstDone = false;

    host('second', ['first'], function(next) {
      assert.ok(firstDone);
      next();
      done();
    });

    host('first', function(next) {
      firstDone = true;
      process.nextTick(next);
    });
  });

  it('should allow mixing of sync and async', function(done) {
    var host = hostess();

    host('fourth', ['third'], function() { done(); });
    host('third', ['second'], function(next) { process.nextTick(next) });
    host('second', ['first'], function() { });
    host('first', function(next) { process.nextTick(next) });
  });

  it('should fire a method if its dep is already met async', function(done) {
    var host = hostess();
    var firstDone = false;

    host('first', function(next) {
      firstDone = true;
      process.nextTick(next);
    });

    host('second', ['first'], function(next) {
      assert.ok(firstDone);
      next();
      done();
    });
  });

  it('should work with many dependencies async', function(done) {
    var host = hostess();

    host('king', ['queen', 'rook', 'bishop', 'knight', 'pawn'], function(next) {
      next();
      done();
    });

    host('queen', ['rook'], function(next) { process.nextTick(next); });
    host('rook', ['bishop', 'knight'], function(next) { process.nextTick(next); });
    host('bishop', ['pawn'], function() {});
    host('knight', ['pawn'], function(next) { process.nextTick(next); });
    host('pawn', function(next) { process.nextTick(next); });

  });

});

describe('hostess handlers', function() {

  it('should catch a thrown error when sync', function(done) {
    var host = hostess();

    host('error', function(err) {
      assert.equal(err.message, 'oh noes');
      done();
    });

    host('throws', function() {
      throw new Error('oh noes');
    });
  });

  it('should throw an error when there is no handler', function(done) {
    var host = hostess();

    try {
      host('throws', function() {
        throw new Error('oh noes');
      });
    } catch (e) {
      return done();
    }
    done(new Error('no error thrown'));
  });

  it('should capture and error in a callback when async', function(done) {
    var host = hostess();

    host('error', function(err) {
      assert.equal(err.message, 'oh noes');
      done();
    });

    host('cb error', function(next) {
      process.nextTick(function() {
        next(new Error('oh noes'));
      });
    });
  });

  it('should only handle the first error thrown', function(done) {
    var host = hostess();

    host('error', function(err) {
      assert.equal(err.message, 'first');
    });

    host('first', function(next) {
      setTimeout(function() {
        next(new Error('first'));
      }, 20);
    });

    host('second', function(next) {
      setTimeout(function() {
        next(new Error('second'));
      }, 30);
    });

    setTimeout(function() {
      assert.ok(true);
      done();
    }, 40);
  });

  it('should fire a done event', function(done) {
    var host = hostess();
    var secondRun = false;

    host('done', function() {
      assert.ok(secondRun);
      done();
    });

    host('second', ['first'], function() {
      secondRun = true;
    });

    host('first', function(next) {
      setTimeout(next, 10);
    });

  });

  it('should not fire a done event without other method', function(done) {
    var host = hostess()

    host('done', function() {
      throw new Error('should never run');
    });

    process.nextTick(done);
  });

  it('should fire a done event whenever the queue is empty', function(done) {
    var host = hostess()
      , count = 0
      , lastCount = null

    host('done', function() {
      assert.notEqual(count, lastCount);
      lastCount = count;
      if (count === 7) {
        done();
      }
    });

    host('a', function() { ++count });
    host('b', function() { ++count });
    host('c', function() { ++count });
    host('d', function() { ++count });
    host('e', function() { ++count });
    host('has dep', ['no dep'], function() { ++count });
    host('no dep', function() { ++count });

  });

});
