import React from "react";
import { mount, shallow } from "enzyme";
import { ConfirmDialog } from "../confirm-dialog";
import { ButtonVariant } from "@patternfly/react-core";

describe("ConfirmDialog", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(
      <ConfirmDialog
        isOpen={true}
        title="My title"
        message="Are you sure you want to do this?"
        confirmBtnLabel="Yes"
        cancelBtnLabel="Cancel"
        confirmBtnVariant={ButtonVariant.danger}
        onClose={jest.fn}
        onConfirm={jest.fn}
        onCancel={jest.fn}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it("Check onClose callback", () => {
    const onCloseSpy = jest.fn();
    const wrapper = mount(
      <ConfirmDialog
        isOpen={true}
        title="My title"
        message="Are you sure you want to do this?"
        confirmBtnLabel="Yes"
        cancelBtnLabel="Cancel"
        confirmBtnVariant={ButtonVariant.danger}
        onClose={onCloseSpy}
        onConfirm={jest.fn}
        onCancel={jest.fn}
      />
    );

    wrapper.find("button[aria-label='Close']").simulate("click");
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });

  it("Check onConfirm callback", () => {
    const onConfirmSpy = jest.fn();
    const wrapper = mount(
      <ConfirmDialog
        isOpen={true}
        title="My title"
        message="Are you sure you want to do this?"
        confirmBtnLabel="Yes"
        cancelBtnLabel="Cancel"
        confirmBtnVariant={ButtonVariant.danger}
        onClose={jest.fn}
        onConfirm={onConfirmSpy}
        onCancel={jest.fn}
      />
    );

    wrapper.find("button[aria-label='confirm']").simulate("click");
    expect(onConfirmSpy).toHaveBeenCalledTimes(1);
  });

  it("Check onCancel callback", () => {
    const onCancelSpy = jest.fn();
    const wrapper = mount(
      <ConfirmDialog
        isOpen={true}
        title="My title"
        message="Are you sure you want to do this?"
        confirmBtnLabel="Yes"
        cancelBtnLabel="Cancel"
        confirmBtnVariant={ButtonVariant.danger}
        onClose={jest.fn}
        onConfirm={jest.fn}
        onCancel={onCancelSpy}
      />
    );

    wrapper.find("button[aria-label='cancel']").simulate("click");
    expect(onCancelSpy).toHaveBeenCalledTimes(1);
  });

  it("Check inProgress disables buttons", () => {
    const wrapper = mount(
      <ConfirmDialog
        isOpen={true}
        title="My title"
        message="Are you sure you want to do this?"
        confirmBtnLabel="Yes"
        cancelBtnLabel="Cancel"
        confirmBtnVariant={ButtonVariant.danger}
        inProgress={true}
        onClose={jest.fn}
        onConfirm={jest.fn}
        onCancel={jest.fn}
      />
    );

    expect(wrapper.find("button[aria-label='confirm']")).toHaveClassName(
      "pf-m-disabled"
    );
    expect(wrapper.find("button[aria-label='cancel']")).toHaveClassName(
      "pf-m-disabled"
    );

    expect(wrapper.find("button[aria-label='close']")).not.toHaveClassName(
      "pf-m-disabled"
    );
  });
});
