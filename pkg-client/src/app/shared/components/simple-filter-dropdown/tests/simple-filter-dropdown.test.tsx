import React from "react";
import { shallow, mount } from "enzyme";
import { SimpleFilterDropdown } from "../simple-filter-dropdown";

describe("SimpleFilterDropdown", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(
      <SimpleFilterDropdown
        label="My label"
        options={[
          { key: "option1", name: "Option 1" },
          { key: "option2", name: "Option 2" },
          { key: "option3", name: "Option 3" },
        ]}
        onSelect={jest.fn()}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it.skip("Check onSelect callback", () => {
    const onSelectSpy = jest.fn();

    const wrapper = mount(
      <SimpleFilterDropdown
        label="My label"
        options={[
          { key: "option1", name: "Option 1" },
          { key: "option2", name: "Option 2" },
          { key: "option3", name: "Option 3" },
        ]}
        onSelect={onSelectSpy}
      />
    );

    // Open dropdown
    wrapper.find(".pf-c-dropdown__toggle").simulate("click");
    wrapper.update();

    // Select option
    wrapper.find(".pf-c-dropdown__menu-item").at(1).simulate("click");
    expect(onSelectSpy).toHaveBeenCalledWith({
      key: "option2",
      name: "Option 2",
    });
  });
});
