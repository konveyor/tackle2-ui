import React from "react";
import { mount, shallow } from "enzyme";

import { AppTableActionButtons } from "../app-table-action-buttons";

describe("AppTableActionButtons", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(
      <AppTableActionButtons onEdit={jest.fn()} onDelete={jest.fn()} />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it("Callback edit", () => {
    const callbackSpy = jest.fn();
    const wrapper = mount(
      <AppTableActionButtons onEdit={callbackSpy} onDelete={jest.fn()} />
    );

    wrapper.find('button[aria-label="edit"]').simulate("click");

    expect(callbackSpy).toHaveBeenCalledTimes(1);
  });

  it("Callback delete", () => {
    const callbackSpy = jest.fn();
    const wrapper = mount(
      <AppTableActionButtons onEdit={jest.fn()} onDelete={callbackSpy} />
    );

    wrapper.find('button[aria-label="delete"]').simulate("click");

    expect(callbackSpy).toHaveBeenCalledTimes(1);
  });
});
