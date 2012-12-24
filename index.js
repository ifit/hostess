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
  this._done = {};
  this._queue = {};
  events.EventEmitter.call(this);
}
util.inherits(Hostess, events.EventEmitter);

Hostess.prototype.host = function(name, deps, callback) {
  if (name === 'error') {
    return this.on('error', deps);
  } else if (name === 'done') {
    return this.on('done', deps);
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
    callback: callback
  }
}

Hostess.prototype.depsMet = function(deps) {
  var met = 0;
  for (var i = 0; i < deps.length; ++i) {
    if (this._done[deps[i]]) ++met;
  }
  return met === deps.length;
}

Hostess.prototype.exec = function(name) {
  var item = this._queue[name];
  if (!item.callback) return;
  if (!this.depsMet(item.deps)) return;

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
    if (err) return self.emit('error', err);
    self._queue[name] = {};
    self._done[name] = true;
    self.checkAllForReady();
  }
}

Hostess.prototype.checkAllForReady = function() {
  var count = 0;
  for (var name in this._queue) {
    if (!this._done[name]) ++count;
    this.exec(name);
  }
  if (count === 0) {
    this.emit('done');
  }
}

