import {
  cleanupInsightsData,
  clearAllFilters,
  deleteAllMigrationWaves,
  deleteApplicationTableRows,
  login,
  seedInsightsData,
} from "../../../../../utils/utils";
import { Insights } from "../../../../models/migration/dynamic-report/insights/insights";
import { dynamicReportFilter } from "../../../../types/constants";

describe(["@tier3"], "Filtering in Insights", function () {
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

  after("Perform test data clean up", function () {
    cleanupInsightsData();
  });
});
