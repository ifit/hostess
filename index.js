"use strict";

var events = require('events')
  , util   = require('util')
  ;

module.exports = hostess;

function hostess() {
  var host = new Hostess();
  return host.host.bind(host);
}

function Hostess() {
  this._queue = {};
  events.EventEmitter.call(this);
}
util.inherits(Hostess, events.EventEmitter);

Hostess.prototype.host = function(name, deps, callback) {
  var self = this;
  if (name === 'error') {
    return this.once('error', function() {
      self.halt = true;
      self.on('error', function() { });
      deps.apply(this, arguments);
    });
  } else if (name === 'done') {
    return this.on('done', deps);
  } else if (name === 'set') {
    return this[deps] = callback;
  }

  if (typeof deps === 'function') {
    callback = deps;
    deps = [];
  }
  this.queue(name, deps, callback);
  this.exec(name);
}

Hostess.prototype.queue = function(name, deps, callback) {
  if (this._queue[name]) return;
  this._queue[name] = {
    deps: deps,
    called: false,
    done: false,
    callback: callback
  }
}

Hostess.prototype.depsMet = function(deps) {
  var met = 0;
  for (var i = 0; i < deps.length; ++i) {
    if (this._queue[deps[i]] && this._queue[deps[i]].done) ++met;
  }
  return met === deps.length;
}

Hostess.prototype.exec = function(name) {
  var self = this;
  var item = this._queue[name];
  if (this.halt) return;
  if (!item.callback) return;
  if (item.called) return;
  if (!this.depsMet(item.deps)) return;

  if (this.debug) {
    setTimeout(function() {
      if (self._queue[name].done) return;
      console.log(name + ' timed out');
    }, this.timeout || 500);

    console.log('calling ' + name);
  }

  item.called = true;

  if (item.callback.length > 0) {
    // async
    item.callback(this.finish(name));
  } else {
    // sync
    try {
      item.callback();
    } catch (e) {
      return this.finish(name)(e);
    }
    this.finish(name)();
  }
}

Hostess.prototype.finish = function(name) {
  var self = this;
  return function(err) {
    self._queue[name].done = true;
    if (err) return self.emit('error', err);
    self.checkAllForReady();
  }
}

Hostess.prototype.checkAllForReady = function() {
  var count = 0;
  for (var name in this._queue) {
    if (!this._queue[name].done) ++count;
    this.exec(name);
  }
  if (count === 0) {
    this.emit('done');
  }
}

