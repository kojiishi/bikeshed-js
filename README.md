This package runs [bikeshed] from node.js.

Uses the online service if it is not locally installed.

```
var bikeshed = require('bikeshed');

bikeshed().then(
  () => console.log('done'),
  err => console.log(err));
```

or from gulp:

```
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

[bikeshed]: https://github.com/tabatkins/bikeshed
