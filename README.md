This package runs [bikeshed] from node.js.

Uses the online service if [bikeshed] is not locally installed.

```javascript
var bikeshed = require('bikeshed');
bikeshed().then(
  file => console.log('Output: ' + file),
  err => console.log(err));
```

or from gulp:

```javascript
var bikeshed = require('bikeshed');

gulp.task("bikeshed", function () {
  return bikeshed();
});

gulp.task("watch", function () {
  gulp.watch("*.bs", function () {
    bikeshed();
  });
});
```

## Install

```
npm -g install bikeshed-js
```
or from github:
```
npm -g install kojiishi/bikeshed-js
```

## Reference

### `function bikeshed(infile, outfile)`

Returns a Promise that resolves on the completion
with the output file path.

The `infile` specifies the [bikeshed] source file path.
If omitted, `'Overview.bs'` is used.

The `outfile` specifies the output file path.
If omitted, the extension of `infile` is replaced with `'.html'`.

If `outfile` is an array,
the output chunks are appended to the array as [Buffer].
In this case, the Promise resolves to the array.

```javascript
console.log(bikeshed('test.bs', []).then(buffers =>
  Buffer.concat(buffers).toString('utf8')));
```

[bikeshed]: https://github.com/tabatkins/bikeshed
[Buffer]: https://nodejs.org/api/buffer.html
