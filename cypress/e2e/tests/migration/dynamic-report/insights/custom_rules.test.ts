import { getRandomCredentialsData } from "../../../../../utils/data_utils";
import {
  clearAllFilters,
  getRandomAnalysisData,
  getRandomApplicationData,
  login,
} from "../../../../../utils/utils";
import { CredentialsSourceControlUsername } from "../../../../models/administration/credentials/credentialsSourceControlUsername";
import { Analysis } from "../../../../models/migration/applicationinventory/analysis";
import { Insights } from "../../../../models/migration/dynamic-report/insights/insights";
import { Issues } from "../../../../models/migration/dynamic-report/issues/issues";
import {
  AnalysisStatuses,
  CredentialType,
  UserCredentials,
  dynamicReportFilter,
} from "../../../../types/constants";
import { AppInsight, AppIssue } from "../../../../types/types";

describe(["@tier3"], "Custom rules in Insights", function () {
  //TODO: Add validation of message in insights when bug https://issues.redhat.com/browse/MTA-3449 will be fixed
  let analysisData: any;
  let applicationData: any;
  let tackleTestApp: Analysis;
  let defaultScCredsUsername: CredentialsSourceControlUsername;

  before("Login and load data", () => {
    Cypress.session.clearAllSavedSessions();
    login();
    cy.visit("/");

    cy.fixture("application").then((data) => {
      applicationData = data;
    });
    cy.fixture("analysis").then((data) => {
      analysisData = data;
    });

    defaultScCredsUsername = new CredentialsSourceControlUsername(
      getRandomCredentialsData(
        CredentialType.sourceControl,
        UserCredentials.usernamePassword,
        true,
        undefined,
        true
      )
    );
    defaultScCredsUsername.create();

    cy.then(() => {
      tackleTestApp = new Analysis(
        getRandomApplicationData("tackleTestApp_", {
          sourceData: applicationData["tackle-testapp-git"],
        }),
        getRandomAnalysisData(
          analysisData["source_analysis_tackle_testapp_custom_rule"]
        )
      );

      tackleTestApp.create();
      tackleTestApp.analyze();
      tackleTestApp.verifyAnalysisStatus(AnalysisStatuses.completed);
    });
  });

  it("Generate and validate Insights with effort 0 in custom rules", () => {
    const tackleTestAppInsights =
      analysisData["source_analysis_tackle_testapp_custom_rule"]["insights"];

    Insights.openList();

    Insights.applyAndValidateFilter(
      dynamicReportFilter.applicationName,
      [tackleTestApp.name],
      tackleTestAppInsights
    );

    tackleTestAppInsights.forEach((insight: AppInsight) => {
      Insights.validateAllFields(insight);
    });

    clearAllFilters();
  });

  it("Generate and validate Issues with effort > 0 in custom rules", () => {
    const tackleTestAppIssues =
      analysisData["source_analysis_tackle_testapp_custom_rule"]["issues"];
    Issues.openList();
    Issues.applyAndValidateFilter(
      dynamicReportFilter.applicationName,
      [tackleTestApp.name],
      tackleTestAppIssues
    );
    tackleTestAppIssues.forEach((issue: AppIssue) => {
      Issues.validateAllFields(issue);
    });

    clearAllFilters();
  });

  after("Cleanup", () => {
    tackleTestApp.delete();
    defaultScCredsUsername.delete();
  });
});
