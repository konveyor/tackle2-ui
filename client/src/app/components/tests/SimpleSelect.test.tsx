import { render } from "@app/test-config/test-utils";

import { SimpleSelect } from "../SimpleSelect";

describe("SimpleSelect", () => {
  it("Renders without crashing", () => {
    const wrapper = render(
      <SimpleSelect
        aria-label="my-selection"
        onChange={jest.fn()}
        options={["uno", "dos"]}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
