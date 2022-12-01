import React from "react";
import { QuestionnaireCategory } from "@app/api/models";
import { WizardStepNavDescription } from "../wizard-step-nav-description";
import { render } from "@app/test-config/test-utils";

describe("WizardStepNavDescription", () => {
  const category: QuestionnaireCategory = {
    id: 123,
    order: 1,
    questions: [],
  };

  it("Renders without crashing", () => {
    const wrapper = render(<WizardStepNavDescription category={category} />);
    expect(wrapper).toMatchSnapshot();
  });
});
