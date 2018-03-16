'use strict';

const onHeaders = require('on-headers');

function convertToMs(hrtime) {
  const ms = hrtime[0] * 1e3 + hrtime[1] * 1e-6;
  return ms.toFixed(3);
}

module.exports = function (hook) {
  return function simpleTiming(req, res, next) {
    const runningTimers = new Map();
    const finishedTimers = new Map();

    res.serverTimingStart = (name) => {
      const startTime = process.hrtime();
      runningTimers.set(name, startTime);
    };
    res.serverTimingEnd = (name) => {
      if (runningTimers.has(name)) {
        const startTime = runningTimers.get(name);
        const timeDifference = process.hrtime(startTime);
        const timeDifferenceMs = convertToMs(timeDifference);
        finishedTimers.set(name, timeDifferenceMs);
      }
    };

    res.serverTimingStart('total');
    onHeaders(res, () => {
      res.serverTimingEnd('total');
      finishedTimers.forEach((value, key) => {
        if (hook) {
          hook(req, key, value);
        }
        res.append('Server-Timing', `${key};dur=${value}`);
      });
    });

    next();
  };
};
