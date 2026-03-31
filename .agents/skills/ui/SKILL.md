---
name: ui
description: Verify user-provided scenarios in a browser using Browser MCP.
alwaysApply: false
---

# Konveyor UI skill

## Prerequisites

Before executing scenarios, verify:

1. **App is accessible** at `http://localhost:9000`.
   If not, ask the user to either:
   - Provide a different URL
   - Start the local service manually
   - Delegate starting the service to this agent using:

   ```bash
   minikube start
   npm run start:dev
   ```

2. **Browser MCP is available** — if using Cursor prefer its built-in Browser Tab integration.
   If unavailable, inform the user how to enable it.

## Domain Knowledge

When additional steps are needed to execute the provided scenarios, consult the `cypress/` folder for reusable patterns:

### Test setup patterns

Find relevant e2e test cases and reuse steps from `before` methods.
Example of creating business services and stakeholders:

```typescript
// cypress/e2e/tests/migration/applicationinventory/applications/create.test.ts

before("Login", function () {
  login();
  cy.visit("/");
  businessservicesList = createMultipleBusinessServices(1);
  stakeHoldersList = createMultipleStakeholders(2);
});
```

### Page object patterns

Find relevant page objects and reuse the steps inside their methods.
Example of deleting an application:

```typescript
// cypress/e2e/models/migration/applicationinventory/application.ts

delete(cancel = false): void {
    Application.open();
    clickItemInKebabMenu(this.name, "Delete");
    if (cancel) {
      cancelForm();
    } else {
      click(commonView.confirmButton);
    }
}
```

### Key directories

| Path                  | Contents                                       |
| --------------------- | ---------------------------------------------- |
| `cypress/e2e/tests/`  | E2e test suites organized by feature area      |
| `cypress/e2e/models/` | Page objects with reusable interaction methods |
