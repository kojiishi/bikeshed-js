This package runs [bikeshed] from node.js.

Uses online service if it is not locally installed.

```
var bikeshed = require('bikeshed');

bikeshed();
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
