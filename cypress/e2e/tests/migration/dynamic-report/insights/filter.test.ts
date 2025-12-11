import {
  clearAllFilters,
  deleteByList,
  getRandomAnalysisData,
  getRandomApplicationData,
  login,
} from "../../../../../utils/utils";
import { Analysis } from "../../../../models/migration/applicationinventory/analysis";
import { Insights } from "../../../../models/migration/dynamic-report/insights/insights";
import {
  AnalysisStatuses,
  dynamicReportFilter,
} from "../../../../types/constants";

describe(["@tier3"], "Filtering in Insights", function () {
  let applicationsList: Analysis[] = [];

  let analysisData: any;
  let applicationData: any;

  before(
    "Login, setup controls, and prepare applications for analysis",
    function () {
      Cypress.session.clearAllSavedSessions();
      login();
      cy.visit("/");

      cy.fixture("application").then((data) => {
        applicationData = data;
      });
      cy.fixture("analysis").then((data) => {
        analysisData = data;
      });

      cy.then(() => {
        applicationsList = [];

        const bookServerApp = new Analysis(
          getRandomApplicationData("IssuesFilteringApp1", {
            sourceData: applicationData["bookserver-app"],
          }),
          getRandomAnalysisData(
            analysisData["source_analysis_on_bookserverapp"]
          )
        );
        applicationsList.push(bookServerApp);

        const coolstoreApp = new Analysis(
          getRandomApplicationData("IssuesFilteringApp2", {
            sourceData: applicationData["coolstore-app"],
          }),
          getRandomAnalysisData(analysisData["source+dep_on_coolStore_app"])
        );
        applicationsList.push(coolstoreApp);

        applicationsList.forEach((application) => application.create());
      });
    }
  );

  it("Filter insights by application name", function () {
    const bookServerApp = applicationsList[0];
    const bookServerInsights =
      analysisData["source_analysis_on_bookserverapp"]["insights"];
    const coolstoreInsights =
      analysisData["source+dep_on_coolStore_app"]["insights"];

    Analysis.analyzeByList(applicationsList);
    Analysis.verifyAllAnalysisStatuses(AnalysisStatuses.completed);

    Insights.openList();

    Insights.applyAndValidateFilter(
      dynamicReportFilter.applicationName,
      [bookServerApp.name],
      bookServerInsights,
      coolstoreInsights
    );

    clearAllFilters();
  });

  after("Perform test data clean up", function () {
    cy.reload();
    deleteByList(applicationsList);
  });
});
