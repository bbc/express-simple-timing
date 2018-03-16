# express-simple-timing

> [Express](http://expressjs.com/) middleware that sets Server Timing API headers and optionally sends timers to stats systems.

`express-simple-timing` returns a middleware function that can be used with an [express](http://expressjs.com/) server. It sends `Server-Timing` headers to the client to allow inspection of route timings. It can also send stats to your stats system by using a callback passed into the constructor.

A default key of `total` is created based on the total time to deliver the entire route.

## Installation

```
npm install --save express-simple-timing
```

## Example Usage

````js
const simpleTiming = require('express-simple-timing');
const router = require('express').Router();

router.use(simpleTiming());

module.exports = router.put('/mypath', function(req, res) {
  res.json({
    message: 'my response'
  });
});
````

This will add a total value by default, such as:

```
server-timing: total;dur=4.043
```

### Custom metrics

By using the `serverTimingStart` and `serverTimingEnd` methods you can send ad hoc metrics for your app:

```
res.serverTimingStart('woof');
barkLikeADog();
res.serverTimingEnd('woof');
```

This will then add an additional timing header:

```
server-timing: woof;dur=2.43
```

### Stats Callback

To use the timing metrics in your own stats system, you can pass a callback which receives `req`, `key` and `value` every time a server-timing header is added.

````js
const myStats = require('my-stats-system');
const simpleTiming = require('express-simple-timing');
const router = require('express').Router();

function myStatsHook(req, key, value) {
  myStats(req.url, key, value);
}

router.use(simpleTiming(myStatsHook));
````

## Test

```
npm test
```
