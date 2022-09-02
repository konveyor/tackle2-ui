import React from "react";
import { shallow } from "enzyme";
import { ApplicationAssessmentPage } from "./application-assessment-page";
import { Assessment } from "@app/api/models";

describe("ApplicationAssessmentPage", () => {
  const assessment: Assessment = {
    status: "STARTED",
    applicationId: 1,
    questionnaire: {
      categories: [],
    },
  };

  it("Renders without crashing", () => {
    const wrapper = shallow(
      <ApplicationAssessmentPage assessment={assessment}>
        Body of page
      </ApplicationAssessmentPage>
    );
    expect(wrapper).toMatchSnapshot();
  });
});
