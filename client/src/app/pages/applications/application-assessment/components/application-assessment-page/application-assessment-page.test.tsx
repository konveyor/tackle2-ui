import React from "react";
import { ApplicationAssessmentPage } from "./application-assessment-page";
import { Assessment } from "@app/api/models";
import { render } from "@app/test-config/test-utils";

describe("ApplicationAssessmentPage", () => {
  const assessment: Assessment = {
    status: "STARTED",
    applicationId: 1,
    questionnaire: {
      categories: [],
    },
  };

  it("Renders without crashing", () => {
    const wrapper = render(
      <ApplicationAssessmentPage assessment={assessment}>
        Body of page
      </ApplicationAssessmentPage>
    );
    expect(wrapper).toMatchSnapshot();
  });
});
