import React from "react";
import { useTranslation } from "react-i18next";

import {
  Button,
  WizardFooterWrapper,
  useWizardContext,
} from "@patternfly/react-core";

export interface CustomWizardFooterProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  isDisabled: boolean;
  isFormInvalid: boolean;
  hasAnswers?: boolean;
  isFirstStepValid?: boolean;
  onNext?: () => void;
  onBack?: () => void;
  onSave: (review: boolean) => void;
  onClose?: () => {};
  onSaveAsDraft: () => void;
}

export const CustomWizardFooter: React.FC<CustomWizardFooterProps> = ({
  isFirstStep,
  isLastStep,
  isDisabled,
  isFormInvalid,
  hasAnswers,
  isFirstStepValid,
  onNext,
  onBack,
  onSave,
  onClose,
  onSaveAsDraft,
}) => {
  const { t } = useTranslation();
  console.log(useWizardContext());
  const { goToNextStep, goToPrevStep, close } = useWizardContext();
  const enableNext = isFirstStepValid;
  return (
    <>
      <WizardFooterWrapper>
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
              <Button
                variant="primary"
                onClick={() => onSave(true)}
                isDisabled={!enableNext || isDisabled || isFormInvalid}
                cy-data="save-and-review"
              >
                {t("actions.saveAndReview")}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={() => {
                goToNextStep();
                onNext && onNext();
              }}
              isDisabled={!enableNext || isDisabled || isFormInvalid}
              cy-data="next"
            >
              {t("actions.next")}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              goToPrevStep();
              onBack && onBack();
            }}
            isDisabled={isFirstStep || isFormInvalid}
            cy-data="back"
          >
            {t("actions.back")}
          </Button>
          <Button
            variant="link"
            onClick={() => {
              close();
              onClose && onClose();
            }}
            cy-data="cancel"
          >
            {t("actions.cancel")}
          </Button>
          {!isFirstStep && (
            <Button
              variant="link"
              onClick={onSaveAsDraft}
              isDisabled={isFormInvalid || isFirstStep || !hasAnswers}
              cy-data="save-as-draft"
            >
              {t("actions.saveAsDraft")}
            </Button>
          )}
        </>
      </WizardFooterWrapper>
    </>
  );
};
