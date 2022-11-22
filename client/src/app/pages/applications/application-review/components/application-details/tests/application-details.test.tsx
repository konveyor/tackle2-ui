import React from "react";

import { ApplicationDetails } from "../application-details";
import { Application, Assessment } from "@app/api/models";
import { render } from "@app/test-config/test-utils";

describe("AppTable", () => {
  it("Renders without crashing", () => {
    const application: Application = {
      name: "myApp",
      description: "myDescription",
    };

    const assessment: Assessment = {
      applicationId: 1,
      status: "COMPLETE",
      questionnaire: {
        categories: [
          {
            id: 1,
            order: 1,
            questions: [],
            title: "title1",
            comment: "comments1",
          },
          {
            id: 2,
            order: 2,
            questions: [],
            title: "title2",
            comment: "comments2",
          },
          {
            id: 3,
            order: 3,
            questions: [],
            title: "title3",
            comment: "comments3",
          },
        ],
      },
    };
    const wrapper = render(
      <ApplicationDetails application={application} assessment={assessment} />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
