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

/**
 * Example test demonstrating Hub API user management
 * This replaces the old Keycloak UI-based user creation
 */

import * as data from "../../../utils/data_utils";
import {
  getAllRoles,
  getAllUsers,
  getCurrentUser,
} from "../../../utils/hub-user-api";
import { login } from "../../../utils/utils";
import { UserArchitect, UserMigrator } from "../../models/hub/users";

describe.skip("Hub User API Example", () => {
  const migrator = new UserMigrator(data.getRandomUserData());
  const architect = new UserArchitect(data.getRandomUserData());

  before(() => {
    // Login as admin first to get authentication
    login();
  });

  describe("User Creation and Management", () => {
    it("Should create users via Hub API", () => {
      // Create users with their respective roles
      migrator.create();
      architect.create();

      // Verify users were created
      getAllUsers().then((users) => {
        const createdMigrator = users.find(
          (u) => u.login === migrator.username
        );
        const createdArchitect = users.find(
          (u) => u.login === architect.username
        );

        expect(createdMigrator).to.exist;
        expect(createdArchitect).to.exist;
      });
    });

    it("Should list all available roles", () => {
      getAllRoles().then((roles) => {
        cy.log(`Total roles: ${roles.length}`);
        const roleNames = roles.map((r) => r.name);
        expect(roleNames).to.include("tackle-migrator");
        expect(roleNames).to.include("tackle-architect");
        expect(roleNames).to.include("tackle-admin");
      });
    });

    it("Should get current user information", () => {
      getCurrentUser().then((authMe) => {
        expect(authMe.user).to.exist;
        expect(authMe.scopes).to.be.an("array");
        cy.log(`Current user: ${authMe.user?.login}`);
        cy.log(`Scopes: ${authMe.scopes?.join(", ")}`);
      });
    });

    it("Should login as migrator", () => {
      migrator.login();

      getCurrentUser().then((authMe) => {
        expect(authMe.user?.login).to.equal(migrator.username);
      });

      migrator.logout();
    });

    it("Should login as architect", () => {
      architect.login();

      getCurrentUser().then((authMe) => {
        expect(authMe.user?.login).to.equal(architect.username);
      });

      architect.logout();
    });
  });

  after(() => {
    // Clean up - delete created users
    login(); // Login as admin to delete users
    migrator.delete();
    architect.delete();
  });
});
