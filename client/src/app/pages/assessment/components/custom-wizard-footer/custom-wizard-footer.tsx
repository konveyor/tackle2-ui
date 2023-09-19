import React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@patternfly/react-core";

import {
  WizardContextConsumer,
  WizardFooter,
} from "@patternfly/react-core/deprecated";
export interface CustomWizardFooterProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  isDisabled: boolean;
  isFormInvalid: boolean;
  isArchetype?: boolean;
  onSave: (review: boolean) => void;
  onSaveAsDraft: () => void;
}

export const CustomWizardFooter: React.FC<CustomWizardFooterProps> = ({
  isFirstStep,
  isLastStep,
  isDisabled,
  isFormInvalid,
  isArchetype,
  onSave,
  onSaveAsDraft,
}) => {
  const { t } = useTranslation();

  return (
    <WizardFooter>
      <WizardContextConsumer>
        {({ onNext, onBack, onClose, activeStep }) => {
          const enableNext =
            activeStep && activeStep.enableNext !== undefined
              ? activeStep.enableNext
              : true;

          return (
            <>
              {isLastStep ? (
                <>
                  <Button
                    variant="primary"
                    onClick={() => onSave(false)}
                    isDisabled={!enableNext || isDisabled || isFormInvalid}
                    cy-data="next"
                  >
                    {t("actions.save")}
                  </Button>
                  {!isArchetype && (
                    <Button
                      variant="primary"
                      onClick={() => onSave(true)}
                      isDisabled={!enableNext || isDisabled || isFormInvalid}
                      cy-data="save-and-review"
                    >
                      {t("actions.saveAndReview")}
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  variant="primary"
                  onClick={onNext}
                  isDisabled={!enableNext || isDisabled || isFormInvalid}
                  cy-data="next"
                >
                  {t("actions.next")}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={onBack}
                isDisabled={isFirstStep || isFormInvalid}
                cy-data="back"
              >
                {t("actions.back")}
              </Button>
              <Button variant="link" onClick={onClose} cy-data="cancel">
                {t("actions.cancel")}
              </Button>
              <Button
                variant="link"
                onClick={onSaveAsDraft}
                isDisabled={isFormInvalid}
                cy-data="save-as-draft"
              >
                {t("actions.saveAsDraft")}
              </Button>
            </>
          );
        }}
      </WizardContextConsumer>
    </WizardFooter>
  );
};
