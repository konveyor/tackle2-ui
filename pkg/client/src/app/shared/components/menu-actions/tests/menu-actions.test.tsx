import React from "react";
import { mount, shallow } from "enzyme";
import { MenuActions } from "../menu-actions";

describe("MenuActions", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(
      <MenuActions
        actions={[
          { label: "Action1", callback: jest.fn() },
          { label: "Action2", callback: jest.fn() },
        ]}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it("Executes callback", () => {
    const callback1Mock = jest.fn();
    const callback2Mock = jest.fn();

    const wrapper = mount(
      <MenuActions
        actions={[
          { label: "Action1", callback: callback1Mock },
          { label: "Action2", callback: callback2Mock },
        ]}
      />
    );

    // Select dropdown btn
    const dropdownBtn = wrapper.find("button").at(0);
    expect(dropdownBtn.text()).toEqual("Actions");

    // Verify callbacks are executed

    dropdownBtn.simulate("click"); // Opens dropdown

    const action1Btn = wrapper.find(".pf-c-dropdown__menu-item").at(0);
    expect(action1Btn.text()).toEqual("Action1");
    action1Btn.simulate("click");
    expect(callback1Mock).toHaveBeenCalledTimes(1);

    dropdownBtn.simulate("click"); // Opens dropdown
    const action2Btn = wrapper.find(".pf-c-dropdown__menu-item").at(1);
    expect(action2Btn.text()).toEqual("Action2");
    action2Btn.simulate("click");
    expect(callback2Mock).toHaveBeenCalledTimes(1);
  });
});
