# Description

This package contains *end-to-end tests* for the `demo-ui`, implemented
using [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer)
test runner.

**NOTE:** Since the `demo-ui` package uses old/incompatible `webpack`
and `babel` packages, the tests are moved to a separate sub-package.

**NOTE:** The `demo-ui` package must be built before running any tests!


# Quick Start

Dependencies can be installed by running:
```
npm install
```

To start the testing suite in *headless-mode*, run:
```
npm run test-headless
```

The testing suite can also be run in *visual-mode*:
```
npm run test-visual
```
