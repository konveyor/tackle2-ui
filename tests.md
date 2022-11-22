## Testing library

- Jest will assume everything in directories names`__test__` will be related to tests.
- Our thought process around test selectors is generally to decouple display logic from any testing logic. This involves following the `testing-library` recommendation for selecting elements based on role instead of creating test specific IDs where possible. [Docs on selector priority here](https://testing-library.com/docs/queries/about/#priority).

  - NOTE: the above applies to our testing methodology for our unit tests. For QE automation tests, we should be providing an `id` for each form field. Other than form fields, we are assuming that QE can use `Patternfly` provided `id` selectors where possible. We plan to handle any issues relating to a missing `id` on a case-by-case basis.

## Test environment

- We are using js-dom (fake dom implementation) for the testing library. Configured in `jest.config.js`.

## Test file organization

- We use the jest functions `describe` and `it` for organizing our test files. These functions are used to create groups of related tests. [Docs here](https://jestjs.io/docs/api#describename-fn).

## Running tests

- To run a single test, run:

```
npm run test -w client -t 'test name here'
```

- To run entire test suite, run:

```

npm run test -w client
```

- To update snapshot tests, run:

```
npm run test -w client -- -u

```

- To run tests in `watch` mode to aid in writing tests, run:

```
npm run test -w client -- --watch
```
