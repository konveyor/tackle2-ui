import { fireEvent, render, screen } from "@app/test-config/test-utils";
import React from "react";
import { CustomWizardFooter } from "../custom-wizard-footer";

describe("AppPlaceholder", () => {
  it("First step: should use 'next' label and 'back' be disabled", () => {
    render(
      <CustomWizardFooter
        isFirstStep={true}
        isLastStep={false}
        isDisabled={false}
        isFormInvalid={false}
        onSave={jest.fn()}
        onSaveAsDraft={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back/i })).toBeDisabled();
  });

  it("Last step: should use 'save' label", () => {
    render(
      <CustomWizardFooter
        isFirstStep={false}
        isLastStep={true}
        isDisabled={false}
        isFormInvalid={false}
        onSave={jest.fn()}
        onSaveAsDraft={jest.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: /^actions.save\b/i })
    ).toBeInTheDocument();
  });

  it("Last step: should have 'saveAndReview' button", () => {
    render(
      <CustomWizardFooter
        isFirstStep={false}
        isLastStep={true}
        isDisabled={false}
        isFormInvalid={false}
        onSave={jest.fn()}
        onSaveAsDraft={jest.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: /^actions.saveAndReview\b/i })
    ).toBeInTheDocument();
  });

  it("Disable all using 'isDisabled=true'", () => {
    render(
      <CustomWizardFooter
        isFirstStep={false}
        isLastStep={false}
        isDisabled={true}
        isFormInvalid={false}
        onSave={jest.fn()}
        onSaveAsDraft={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /back/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /saveAsDraft/i })).toBeDisabled();
  });

  it("Disable actions using 'isFormInvalid=true'", () => {
    render(
      <CustomWizardFooter
        isFirstStep={false}
        isLastStep={false}
        isDisabled={false}
        isFormInvalid={true}
        onSave={jest.fn()}
        onSaveAsDraft={jest.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /back/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /saveAsDraft/i })).toBeDisabled();
  });

  it("Last step: should call 'onSave' callback", () => {
    const onSaveSpy = jest.fn();

    render(
      <CustomWizardFooter
        isFirstStep={false}
        isLastStep={true}
        isDisabled={false}
        isFormInvalid={false}
        onSave={onSaveSpy}
        onSaveAsDraft={jest.fn()}
      />
    );
    const nextButton = screen.getByRole("button", { name: /^actions.save\b/i });

    fireEvent.click(nextButton);

    expect(onSaveSpy).toHaveBeenCalledTimes(1);
  });

  it("On step: should call 'saveAsDraft' callback", () => {
    const onSaveAsDraftSpy = jest.fn();

    render(
      <CustomWizardFooter
        isFirstStep={false}
        isLastStep={false}
        isDisabled={false}
        isFormInvalid={false}
        onSave={jest.fn()}
        onSaveAsDraft={onSaveAsDraftSpy}
      />
    );

    const saveAsDraftButton = screen.getByRole("button", {
      name: /^actions.saveAsDraft\b/i,
    });

    fireEvent.click(saveAsDraftButton);

    expect(onSaveAsDraftSpy).toHaveBeenCalledTimes(1);
  });
});
