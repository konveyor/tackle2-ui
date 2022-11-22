import React from "react";
import { ConfirmDialog } from "../confirm-dialog";
import { ButtonVariant } from "@patternfly/react-core";
import { fireEvent, render, screen } from "@app/test-config/test-utils";

describe("ConfirmDialog", () => {
  it("Renders without crashing", () => {
    const wrapper = render(
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
    render(
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
    const closeButton = screen.getByRole("button", {
      name: /^Close\b/i,
    });
    fireEvent.click(closeButton);

    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });

  it("Check onConfirm callback", () => {
    const onConfirmSpy = jest.fn();
    render(
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

    const confirmButton = screen.getByRole("button", {
      name: /^Confirm\b/i,
    });
    fireEvent.click(confirmButton);
    expect(onConfirmSpy).toHaveBeenCalledTimes(1);
  });

  it("Check onCancel callback", () => {
    const onCancelSpy = jest.fn();
    render(
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

    const cancelButton = screen.getByRole("button", {
      name: /^Cancel\b/i,
    });
    fireEvent.click(cancelButton);
    expect(onCancelSpy).toHaveBeenCalledTimes(1);
  });

  it("Check inProgress disables buttons", () => {
    render(
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

    const cancelButton = screen.getByRole("button", {
      name: /^Cancel\b/i,
    });
    expect(cancelButton).toBeDisabled();

    const closeButton = screen.getByRole("button", {
      name: /^Close\b/i,
    });
    expect(closeButton).not.toBeDisabled();
  });
});
