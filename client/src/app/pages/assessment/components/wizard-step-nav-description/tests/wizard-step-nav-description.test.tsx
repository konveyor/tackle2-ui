import { Section } from "@app/api/models";
import { render } from "@app/test-config/test-utils";

import { WizardStepNavDescription } from "../wizard-step-nav-description";

describe("WizardStepNavDescription", () => {
  const section: Section = {
    name: "Section 1",
    order: 1,
    questions: [],
    comment: "",
  };

  it("Renders without crashing", () => {
    const wrapper = render(<WizardStepNavDescription section={section} />);
    expect(wrapper).toMatchSnapshot();
  });
});
