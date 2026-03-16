import { render } from "@app/test-config/test-utils";

import { QuestionBody } from "../question-body";

describe("QuestionBody", () => {
  it("Renders without crashing", () => {
    const wrapper = render(<QuestionBody>content</QuestionBody>);
    expect(wrapper).toMatchSnapshot();
  });
});
