import {
  cleanupInsightsData,
  clearAllFilters,
  deleteAllMigrationWaves,
  deleteApplicationTableRows,
  login,
  seedInsightsData,
} from "../../../../../utils/utils";
import { Insights } from "../../../../models/migration/dynamic-report/insights/insights";
import { Issues } from "../../../../models/migration/dynamic-report/issues/issues";
import { dynamicReportFilter } from "../../../../types/constants";
import { AppInsight, AppIssue } from "../../../../types/types";

describe(["@tier3", "@tier3_D"], "Insights and custom rules", function () {
  // Application names created by seedInsightsData
  const bookserverAppNames = ["InsightsFilteringApp1_0"];

  before("Login and seed insights data", function () {
    Cypress.session.clearAllSavedSessions();
    login();
    cy.visit("/");
    deleteAllMigrationWaves();
    deleteApplicationTableRows();
    cleanupInsightsData();
    seedInsightsData();
  });

  beforeEach("Load data", function () {
    cy.fixture("analysis").then(function (data) {
      this.analysisData = data;
    });
  });

  it("Filter insights by application name", function () {
    const bookServerInsights =
      this.analysisData["source_analysis_on_bookserverapp"]["insights"];
    const coolstoreInsights =
      this.analysisData["source+dep_on_coolStore_app"]["insights"];

    Insights.openList();

    Insights.applyAndValidateFilter(
      dynamicReportFilter.applicationName,
      [bookserverAppNames[0]],
      bookServerInsights,
      coolstoreInsights
    );

    clearAllFilters();
  });

  it("Generate and validate Insights with effort 0 in custom rules", function () {
    const tackleTestAppInsights =
      this.analysisData["source_analysis_tackle_testapp_custom_rule"][
        "insights"
      ];

    Insights.openList();

    Insights.applyAndValidateFilter(
      dynamicReportFilter.applicationName,
      ["tackleTestApp_CustomRule"],
      tackleTestAppInsights
    );

    tackleTestAppInsights.forEach((insight: AppInsight) => {
      Insights.validateAllFields(insight);
    });

    clearAllFilters();
  });

  it("Generate and validate Issues with effort > 0 in custom rules", function () {
    const tackleTestAppIssues =
      this.analysisData["source_analysis_tackle_testapp_custom_rule"]["issues"];

    Issues.openList();
    Issues.applyAndValidateFilter(
      dynamicReportFilter.applicationName,
      ["tackleTestApp_CustomRule"],
      tackleTestAppIssues
    );

    tackleTestAppIssues.forEach((issue: AppIssue) => {
      Issues.validateAllFields(issue);
    });

    clearAllFilters();
  });

  after("Perform test data clean up", function () {
    cleanupInsightsData();
  });
});
