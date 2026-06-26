# Testing

This document covers testing for the tackle2-ui client.

## Test Priorities

Unit tests cover two areas with different priority levels:

1. **Data processing tests** — pure function and data handling tests. High priority — these protect correctness guarantees.
2. **Component render tests** — `@testing-library/react` with jsdom. Lower priority than data tests and e2e tests. Select elements by role, not by test-specific IDs.

## Unit Testing with Jest

### Testing library

- Jest will assume everything in directories named `__test__` will be related to tests.
- Our thought process around test selectors is generally to decouple display logic from any testing logic. This involves following the `testing-library` recommendation for selecting elements based on role instead of creating test specific IDs where possible. [Docs on selector priority here](https://testing-library.com/docs/queries/about/#priority).
  - NOTE: the above applies to our testing methodology for our unit tests. For QE automation tests, we should be providing an `id` for each form field. Other than form fields, we are assuming that QE can use `Patternfly` provided `id` selectors where possible. We plan to handle any issues relating to a missing `id` on a case-by-case basis.

## Test environment

- We are using js-dom (fake dom implementation) for the testing library. Configured in `jest.config.js`.

## Test file organization

- We use the jest functions `describe` and `it` for organizing our test files. These functions are used to create groups of related tests. [Docs here](https://jestjs.io/docs/api#describename-fn).

## Running tests

- To run a single test, run:

```bash
npm run test -w client -t 'test name here'
```

- To run entire test suite, run:

```bash
npm run test -w client
```

- To update snapshot tests, run:

```bash
npm run test -w client -- -u
```

- To run tests in `watch` mode to aid in writing tests, run:

```bash
npm run test -w client -- --watch
```

## E2E Testing

For end-to-end testing with Cypress, see [cypress/README.md](/cypress/README.md).

E2E tests use page object models: `cypress/e2e/models/{domain}/{feature}.ts` encapsulates interactions. Shared selectors live in `cypress/e2e/views/`. Test specs are in `cypress/e2e/tests/`. Cypress test patterns rely on `data-ouia-component-id` (PatternFly OUIA) for stable selectors.
