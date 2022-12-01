import React from "react";
import { ApplicationAssessmentPageHeader } from "./application-assessment-page-header";
import { Assessment } from "@app/api/models";
import { render } from "@app/test-config/test-utils";

describe("ApplicationAssessmentPageHeader", () => {
  const assessment: Assessment = {
    status: "STARTED",
    applicationId: 1,
    questionnaire: {
      categories: [],
    },
  };

  it("Renders without crashing", () => {
    const wrapper = render(
      <ApplicationAssessmentPageHeader assessment={assessment}>
        Body of page
      </ApplicationAssessmentPageHeader>
    );
    expect(wrapper).toMatchSnapshot();
  });
});
