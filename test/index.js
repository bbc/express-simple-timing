'use strict';

const routeTimer = require('..');
const request = require('supertest');
const express = require('express');
const sandbox = require('sinon').sandbox.create();

function defaultRoute(req, res) {
  res.send('hi');
}

function requestWithTimer(route = defaultRoute) {
  const app = express();

  app.get('/', routeTimer(), route);

  return request(app)
    .get('/');
}

function requestWithTimerAndHook(hook, route = defaultRoute) {
  const app = express();

  app.get('/', routeTimer(hook), route);

  return request(app)
    .get('/');
}

describe('simpleTiming()', () => {
  beforeEach(() => {
    sandbox.stub(process, 'hrtime')
      .onCall(0).returns([1800216, 25])
      .onCall(1).returns([0, 2324231]);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('sets response time header', () => {
    return requestWithTimer()
      .expect('Server-Timing', 'total;dur=2.324')
      .expect(200);
  });

  it('appends to existing Server-Timing header', () => {
    return requestWithTimer((req, res) => {
      res.append('Server-Timing', 'data;dur=4.04');
      res.send('hi');
    })
      .expect('Server-Timing', 'data;dur=4.04, total;dur=2.324')
      .expect(200);
  });

  it('allows adding ad hoc server timing values', () => {
    process.hrtime
      .onCall(0).returns([0, 25])
      .onCall(1).returns([0, 25])
      .onCall(2).returns([0, 4043210])
      .onCall(3).returns([0, 2324231]);

    return requestWithTimer((req, res) => {
      res.serverTimingStart('data');
      res.serverTimingEnd('data');
      res.send('hi');
    })
      .expect('Server-Timing', 'data;dur=4.043, total;dur=2.324')
      .expect(200)
      .then(() => {
        sandbox.assert.calledWith(process.hrtime, [0, 25]);
      });
  });

  it('calls stats hook for each request', () => {
    const hook = sandbox.spy();

    return requestWithTimerAndHook(hook)
      .expect(200)
      .then(() => {
        sandbox.assert.calledOnce(hook);
        sandbox.assert.calledWith(hook, sandbox.match({ url: '/' }), 'total', '2.324');
      });
  });

  it('calls stats hook with ad hoc server timing values', () => {
    const hook = sandbox.spy();

    process.hrtime
      .onCall(0).returns([0, 25])
      .onCall(1).returns([0, 25])
      .onCall(2).returns([0, 4043210])
      .onCall(3).returns([0, 2324231]);

    return requestWithTimerAndHook(hook, (req, res) => {
      res.serverTimingStart('data');
      res.serverTimingEnd('data');
      res.send('hi');
    })
      .expect('Server-Timing', 'data;dur=4.043, total;dur=2.324')
      .expect(200)
      .then(() => {
        sandbox.assert.calledTwice(hook);
        sandbox.assert.calledWith(hook, sandbox.match({ url: '/' }), 'total', '2.324');
        sandbox.assert.calledWith(hook, sandbox.match({ url: '/' }), 'data', '4.043');
        sandbox.assert.calledWith(process.hrtime, [0, 25]);
      });
  });

  it('ignores timings without a start', () => {
    return requestWithTimer((req, res) => {
      res.serverTimingEnd('data');
      res.send('hi');
    })
      .expect(200);
  });
});
