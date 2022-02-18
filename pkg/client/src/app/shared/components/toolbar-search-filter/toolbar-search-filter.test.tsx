import React from "react";
import { shallow, mount } from "enzyme";
import { ToolbarSearchFilter } from "./toolbar-search-filter";

describe("ToolbarSearchFilter", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(
      <ToolbarSearchFilter
        filters={[
          {
            key: "filter1",
            name: "Filter 1",
            input: <input cy-data="filter1" />,
          },
          {
            key: "filter2",
            name: "Filter 2",
            input: <input cy-data="filter2" />,
          },
          {
            key: "filter3",
            name: "Filter 3",
            input: <input cy-data="filter3" />,
          },
        ]}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it("Renders without crashing when no filter is provided", () => {
    const wrapper = shallow(<ToolbarSearchFilter filters={[]} />);
    expect(wrapper).toMatchSnapshot();
  });

  it.skip("Select appropiate filter", () => {
    const wrapper = mount(
      <ToolbarSearchFilter
        filters={[
          {
            key: "filter1",
            name: "Filter 1",
            input: <input cy-data="filter1" />,
          },
          {
            key: "filter2",
            name: "Filter 2",
            input: <input cy-data="filter2" />,
          },
          {
            key: "filter3",
            name: "Filter 3",
            input: <input cy-data="filter3" />,
          },
        ]}
      />
    );

    // Open dropdown
    wrapper.find(".pf-c-dropdown__toggle").simulate("click");
    wrapper.update();

    // Select option
    wrapper.find(".pf-c-dropdown__menu-item").at(2).simulate("click");
    expect(wrapper.find("input[cy-data='filter3']")).not.toBeNull();
  });
});
