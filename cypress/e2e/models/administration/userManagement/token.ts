import {
  click,
  clickByText,
  inputText,
  selectUserPerspective,
} from "../../../../utils/utils";
import { SEC, administration } from "../../../types/constants";
import * as commonView from "../../../views/common.view";
import * as userManagementView from "../../../views/user-management.view";

export class Token {
  lifespan?: number;
  tokenValue?: string;
  id?: number;

  static fullUrl = Cypress.config("baseUrl") + "/users/tokens";

  constructor(lifespan?: number) {
    this.lifespan = lifespan;
  }

  static openList(forceReload = false) {
    if (forceReload) {
      cy.visit(Token.fullUrl, { timeout: 35 * SEC }).then(() => {
        cy.get("h1", { timeout: 10 * SEC }).should("contain", "Tokens");
      });
      return;
    }

    cy.url().then(($url) => {
      if ($url !== Token.fullUrl) {
        selectUserPerspective(administration);
        clickByText(commonView.navLink, "Tokens");
        cy.get("h1", { timeout: 60 * SEC }).should("contain", "Tokens");
      }
    });
  }

  /**
   * Creates a new API token from the UI and captures the generated token value.
   * The token is displayed only once in a ClipboardCopy component after creation.
   */
  create(): Cypress.Chainable<string> {
    Token.openList();

    click(userManagementView.createTokenButton);

    if (this.lifespan !== undefined) {
      inputText(userManagementView.lifespanInput, this.lifespan.toString());
    }

    click(userManagementView.tokenCreateButton);

    // Wait for the token creation success modal
    cy.contains("Token created", { timeout: 10 * SEC }).should("be.visible");

    // Capture the token value from the ClipboardCopy component
    return cy
      .get('input[aria-label="Copyable input"]')
      .invoke("val")
      .then((tokenValue) => {
        this.tokenValue = tokenValue as string;
        return tokenValue;
      })
      .then((tokenValue) => {
        cy.contains("button", "Close").click();
        cy.get("h1", { timeout: 10 * SEC }).should("contain", "Tokens");
        return cy.wrap(tokenValue as string);
      });
  }

  /**
   * Test the token by making authenticated API calls.
   * @param token - The token string to test
   * @returns Cypress chainable for assertions
   */
  static testTokenViaAPI(token: string) {
    return cy
      .request({
        method: "GET",
        url: "/hub/auth/self",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        failOnStatusCode: false,
        auth: null,
      })
      .then((response) => {
        return response;
      });
  }

  /**
   * Make an API call to list applications using the token.
   * This verifies the token has proper scopes.
   */
  static testApplicationsAPI(token: string) {
    return cy.request({
      method: "GET",
      url: "/hub/applications",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      failOnStatusCode: false,
      auth: null,
    });
  }

  /**
   * Make an API call to list tokens using the token.
   * This verifies the token can access token management endpoints.
   */
  static testTokensAPI(token: string) {
    return cy.request({
      method: "GET",
      url: "/hub/auth/tokens",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      failOnStatusCode: false,
      auth: null,
    });
  }

  /**
   * Revoke (delete) a token via the UI.
   */
  static revokeTokenByLogin(login: string) {
    Token.openList();

    // Find the row with the login and click the revoke action
    cy.contains("td", login)
      .parent("tr")
      .within(() => {
        cy.get('button[aria-label="Actions"]').click();
      });

    cy.contains("button", "Revoke").click();
  }

  /**
   * Delete all tokens for a specific user via API.
   */
  static deleteAllTokensViaAPI(
    login: string,
    headers?: Record<string, string>
  ) {
    cy.request({
      method: "GET",
      url: "/hub/auth/tokens",
      ...(headers && { headers }),
    }).then((response) => {
      const tokens = response.body;

      // Filter tokens by login (user.login in the token object)
      const userTokens = tokens.filter(
        (t: { user?: { login?: string; name?: string } }) =>
          t.user?.login === login || t.user?.name === login
      );

      userTokens.forEach((token: { id: number }) => {
        cy.request({
          method: "DELETE",
          url: `/hub/auth/tokens/${token.id}`,
          ...(headers && { headers }),
        });
      });
    });
  }
}
