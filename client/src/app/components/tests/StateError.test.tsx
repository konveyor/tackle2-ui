import { render } from "@app/test-config/test-utils";

import { StateError } from "../StateError";

describe("StateError", () => {
  it("Renders without crashing", () => {
    const wrapper = render(<StateError />);
    expect(wrapper).toMatchSnapshot();
  });
});
