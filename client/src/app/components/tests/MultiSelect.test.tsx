import { render } from "@app/test-config/test-utils";

import { MultiSelect } from "../FilterToolbar/components/MultiSelect";

describe("MultiSelect", () => {
  it("Renders without crashing", () => {
    const wrapper = render(
      <MultiSelect
        aria-label="my-selection"
        toggleId="my-selection"
        onSelect={jest.fn()}
        onClear={jest.fn()}
        options={["uno", "dos"].map((option) => ({
          value: option,
        }))}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
