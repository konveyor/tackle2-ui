/*
 * Copyright © 2021 the Konveyor Contributors (https://konveyor.io/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// custom commands
export {};
declare global {
  /* eslint-disable @typescript-eslint/no-namespace -- Cypress command augmentation requires namespace */
  namespace Cypress {
    interface Chainable {
      /**
       * Drags an element to a drop location.
       * This custom command works only on Chromium-based browsers
       * @example cy.dragAndDrop(cy.get('#source'), cy.get('#target'))
       * @param dragElement
       * @param dropElement
       */
      dragAndDrop(
        dragElement: Cypress.Chainable,
        dropElement: Cypress.Chainable
      ): void;

      /**
       * Fetch the UI's client environment configuration from the /.env endpoint
       * and return it as a Chainable.
       */
      uiEnvironmentConfig(): Cypress.Chainable<object>;
    }
  }
  /* eslint-enable @typescript-eslint/no-namespace */
}

Cypress.Commands.add(
  "dragAndDrop",
  (dragElement: Cypress.Chainable, dropElement: Cypress.Chainable) => {
    dragElement
      .realMouseDown({ button: "left", position: "center" })
      .realMouseMove(0, 10, { position: "center" })
      .wait(200);
    dropElement
      .realMouseMove(0, 0, { position: "topLeft" })
      .realMouseUp()
      .wait(200);
  }
);

Cypress.Commands.add("uiEnvironmentConfig", () =>
  // The /.env endpoint is served by Caddy (production) or the rspack dev server
  // proxy.  In both cases it returns the ClientEnv fields as a JSON object —
  // the same data that Caddy inlines into index.html via {{httpInclude "/.env"}}.
  cy.request("/.env").then<object>((resp) => {
    expect(resp.status).to.eq(200);
    cy.log("/.env: ", JSON.stringify(resp.body));
    return cy.wrap(resp.body);
  })
);
