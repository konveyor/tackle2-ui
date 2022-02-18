import React from "react";
import { shallow } from "enzyme";
import { QuestionnaireCategory } from "@app/api/models";
import { WizardStepNavDescription } from "../wizard-step-nav-description";

describe("WizardStepNavDescription", () => {
  const category: QuestionnaireCategory = {
    id: 123,
    order: 1,
    questions: [],
  };

  it("Renders without crashing", () => {
    const wrapper = shallow(<WizardStepNavDescription category={category} />);
    expect(wrapper).toMatchSnapshot();
  });
});
