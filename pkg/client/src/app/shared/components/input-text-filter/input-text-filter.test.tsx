import React from "react";
import { shallow, mount } from "enzyme";
import { InputTextFilter } from "./input-text-filter";

describe("InputTextFilter", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(<InputTextFilter onApplyFilter={jest.fn()} />);
    expect(wrapper).toMatchSnapshot();
  });

  it.skip("Call 'onApplyFilter' using search btn", () => {
    const onApplyFilterSpy = jest.fn();
    const wrapper = mount(<InputTextFilter onApplyFilter={onApplyFilterSpy} />);

    // Change search input text
    const searchInput = wrapper.find("input");
    (searchInput.getDOMNode() as HTMLInputElement).value = "my filter text";
    searchInput.simulate("change");

    // Apply filter
    wrapper.find("button[aria-label='search']").simulate("click");

    // Verify
    expect(onApplyFilterSpy).toHaveBeenCalledWith("my filter text");
  });

  it.skip("Call 'onApplyFilter' using {enter}", () => {
    const onApplyFilterSpy = jest.fn();
    const wrapper = mount(<InputTextFilter onApplyFilter={onApplyFilterSpy} />);

    // Change search input text
    const searchInput = wrapper.find("input");
    (searchInput.getDOMNode() as HTMLInputElement).value = "my filter text";
    searchInput.simulate("change");

    // Apply filter
    wrapper.find("input").simulate("keypress", { key: "Enter" });

    // Verify
    expect(onApplyFilterSpy).toHaveBeenCalledWith("my filter text");
  });
});
