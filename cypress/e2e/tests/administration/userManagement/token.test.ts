/*
Copyright © 2021 the Konveyor Contributors (https://konveyor.io/)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
/// <reference types="cypress" />

import { login } from "../../../../utils/utils";
import { Token } from "../../../models/administration/userManagement/token";

describe(
  ["@tier1", "@tier1_authNeeded"],
  "Token API authentication tests",
  () => {
    before("Login as admin", () => {
      login();
    });

    it("Should create API token from UI and authenticate via API", function () {
      // Step 1: Create a new token from the UI
      const token = new Token();

      token.create().then((tokenValue) => {
        // Verify token was captured
        expect(tokenValue).to.be.a("string");
        expect(tokenValue.length).to.be.greaterThan(20);

        cy.log(`Generated token: ${tokenValue.substring(0, 20)}...`);

        // Step 2: Test the token by calling /auth/self endpoint
        Token.testTokenViaAPI(tokenValue).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.have.property("user");
          expect(response.body).to.have.property("scopes");

          cy.log("✓ Token successfully authenticated to /auth/self");
          cy.log(`User: ${JSON.stringify(response.body.user)}`);
          cy.log(`Scopes: ${response.body.scopes.join(", ")}`);
        });

        // Step 3: Test the token by calling /applications endpoint
        Token.testApplicationsAPI(tokenValue).then((response) => {
          expect(response.status).to.eq(200);

          // Parse body if it's a string
          const body =
            typeof response.body === "string"
              ? JSON.parse(response.body)
              : response.body;
          expect(body).to.be.an("array");

          cy.log("✓ Token successfully authenticated to /applications");
          cy.log(`Found ${body.length} applications`);
        });

        // Step 4: Test the token by calling /auth/tokens endpoint
        Token.testTokensAPI(tokenValue).then((response) => {
          expect(response.status).to.eq(200);

          // Parse body if it's a string
          const body =
            typeof response.body === "string"
              ? JSON.parse(response.body)
              : response.body;
          expect(body).to.be.an("array");

          cy.log("✓ Token successfully authenticated to /auth/tokens");
          cy.log(`Found ${body.length} tokens`);

          // Verify our newly created token is in the list
          const createdToken = body.find(
            (t: { kind: string }) => t.kind === "api-key"
          );
          expect(createdToken).to.exist;
        });
      });
    });

    it("Should reject invalid token", function () {
      const invalidToken = "invalid-token-12345";

      Token.testTokenViaAPI(invalidToken).then((response) => {
        // Should get 401 Unauthorized for invalid token
        expect(response.status).to.eq(401);
        cy.log("✓ Invalid token correctly rejected with 401");
      });
    });

    it("Should create token with custom lifespan", function () {
      // Create token with 24 hours lifespan
      const customToken = new Token(24);

      customToken.create().then((tokenValue) => {
        expect(tokenValue).to.be.a("string");

        // Test the token works
        Token.testTokenViaAPI(tokenValue).then((response) => {
          expect(response.status).to.eq(200);
          cy.log("✓ Custom lifespan token works correctly");
        });

        // Verify the token list is accessible
        Token.testTokensAPI(tokenValue).then((response) => {
          // Parse body if it's a string
          const body =
            typeof response.body === "string"
              ? JSON.parse(response.body)
              : response.body;

          // Verify we can access the tokens list
          expect(body).to.be.an("array");
          expect(body.length).to.be.greaterThan(0);

          // Find api-key tokens
          const apiKeyTokens = body.filter(
            (t: { kind: string }) => t.kind === "api-key"
          );

          cy.log(`Found ${apiKeyTokens.length} API key token(s)`);

          // Note: We can't reliably identify which specific token we just created
          // from the list, so we just verify that api-key tokens exist
          expect(apiKeyTokens.length).to.be.greaterThan(0);
        });
      });
    });

    it("Should verify API token inherits admin scopes", function () {
      const adminToken = new Token();

      adminToken.create().then((tokenValue) => {
        // Test various endpoints that require admin scopes
        Token.testTokenViaAPI(tokenValue).then((authResponse) => {
          expect(authResponse.status).to.eq(200);

          // Parse body if it's a string
          const body =
            typeof authResponse.body === "string"
              ? JSON.parse(authResponse.body)
              : authResponse.body;
          const scopes = body.scopes;
          cy.log(`Admin token scopes: ${scopes.join(", ")}`);

          // Verify admin has comprehensive scopes
          // The actual scopes depend on the admin role configuration
          expect(scopes.length).to.be.greaterThan(0);

          // Test that admin can access user management endpoints
          cy.request({
            method: "GET",
            url: "/hub/users",
            headers: {
              Authorization: `Bearer ${tokenValue}`,
              Accept: "application/json",
            },
            failOnStatusCode: false,
            auth: null, // Disable session auth - use only Bearer token
          }).then((response) => {
            expect(response.status).to.eq(200);
            cy.log("✓ Admin token can access /users endpoint");
          });

          // Test that admin can access roles endpoint
          cy.request({
            method: "GET",
            url: "/hub/roles",
            headers: {
              Authorization: `Bearer ${tokenValue}`,
              Accept: "application/json",
            },
            failOnStatusCode: false,
            auth: null, // Disable session auth - use only Bearer token
          }).then((response) => {
            expect(response.status).to.eq(200);
            cy.log("✓ Admin token can access /roles endpoint");
          });
        });
      });
    });
  }
);
