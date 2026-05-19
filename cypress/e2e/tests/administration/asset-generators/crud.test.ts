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

import * as data from "../../../../utils/data_utils";
import {
  checkSuccessAlert,
  exists,
  getRandomApplicationData,
  login,
  notExists,
} from "../../../../utils/utils";
import { AssetGenerator } from "../../../models/administration/asset-generators/asset-generator";
import { CredentialsSourceControlUsername } from "../../../models/administration/credentials/credentialsSourceControlUsername";
import { Analysis } from "../../../models/migration/applicationinventory/analysis";
import { Application } from "../../../models/migration/applicationinventory/application";
import { Archetype } from "../../../models/migration/archetypes/archetype";
import { TargetProfile } from "../../../models/migration/archetypes/target-profile";
import {
  CredentialType,
  MIN,
  defaultGenerator,
} from "../../../types/constants";
import { successAlertMessage } from "../../../views/common.view";

describe(["@tier2", "@tier2_A"], "CRUD operations on Asset Generators", () => {
  before("Load fixture data", function () {
    cy.fixture("generator").then((generatorFixture) => {
      this.generatorFixture = generatorFixture;
    });
    cy.fixture("application").then((appData) => {
      this.appData = appData;
    });
    login();
    cy.visit("/");
  });

  it("Perform CRUD tests on asset generator", function () {
    const generator = new AssetGenerator(
      data.getRandomAssetGeneratorData(
        this.generatorFixture["cf-k8s-helm-chart"]
      )
    );
    generator.create();
    checkSuccessAlert(
      successAlertMessage,
      "New generator was successfully created.",
      true
    );
    exists(generator.name);

    const newName = `Generator-updatedName-${data.getRandomNumber()}`;
    generator.edit({ name: newName });
    checkSuccessAlert(
      successAlertMessage,
      "generator was successfully saved.",
      true
    );
    exists(newName);

    generator.delete();
    checkSuccessAlert(
      successAlertMessage,
      `Generator ${generator.name} was successfully deleted.`,
      true
    );
    notExists(generator.name);
  });

  it("Test asset generation end-to-end", function () {
    // login();

    const tagName = "Apache Aries";
    const branchName = `test-asset-gen-${Date.now()}`;
    const githubToken = Cypress.env("git_password");

    cy.request({
      method: "GET",
      url: "https://api.github.com/repos/jortel/hack/git/refs/heads/main",
      headers: {
        Authorization: `token ${githubToken}`,
      },
    }).then((response) => {
      const mainSha = response.body.object.sha;

      cy.request({
        method: "POST",
        url: "https://api.github.com/repos/jortel/hack/git/refs",
        headers: {
          Authorization: `token ${githubToken}`,
        },
        body: {
          ref: `refs/heads/${branchName}`,
          sha: mainSha,
        },
      });
    });

    const credential = new CredentialsSourceControlUsername({
      name: `asset-gen-cred-${data.getRandomWord(5)}`,
      description: "Credential for asset generation test",
      username: Cypress.env("git_user"),
      password: githubToken,
      type: CredentialType.sourceControl,
    });
    credential.create();

    const application = new Analysis(
      getRandomApplicationData("asset-gen-test", {
        sourceData: this.appData["asset-generator-repo"],
      }),
      {} as any
    );
    application.tags = [tagName];
    application.branch = branchName;
    application.create();

    Application.open();
    application.manageCredentials(credential.name);

    const archetype = new Archetype(
      `asset-gen-archetype-${data.getRandomWord(5)}`,
      [tagName],
      []
    );
    archetype.create();

    const targetProfile = new TargetProfile(
      `asset-gen-profile-${data.getRandomWord(5)}`,
      [defaultGenerator]
    );
    targetProfile.create(archetype.name);
    checkSuccessAlert(
      successAlertMessage,
      `Success alert:Target profile was successfully created.`,
      true
    );

    application.generateAssets(targetProfile.name);

    cy.wait(2 * MIN);

    application.delete();
    targetProfile.delete();
    archetype.delete();
    credential.delete();

    cy.request({
      method: "DELETE",
      url: `https://api.github.com/repos/jortel/hack/git/refs/heads/${branchName}`,
      headers: {
        Authorization: `token ${githubToken}`,
      },
      failOnStatusCode: false,
    });
  });
});
