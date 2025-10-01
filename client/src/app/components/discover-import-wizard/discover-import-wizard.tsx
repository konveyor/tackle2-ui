import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  ModalVariant,
  Wizard,
  WizardHeader,
  WizardStep,
} from "@patternfly/react-core";

import { SourcePlatform } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { universalComparator } from "@app/utils/utils";

import { FilterInput } from "./filter-input";
import { Results } from "./results";
import { Review } from "./review";
import { SelectPlatform } from "./select-platform";
import { useStartPlatformApplicationImport } from "./useStartPlatformApplicationImport";
import { useWizardReducer } from "./useWizardReducer";

export const DiscoverImportWizard: React.FC<IDiscoverImportWizard> = ({
  isOpen,
  ...props
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <DiscoverImportWizardInner
      key={isOpen ? "open" : "closed"}
      isOpen={isOpen}
      {...props}
    />
  );
};

export interface IDiscoverImportWizard {
  platform?: SourcePlatform;
  onClose: () => void;
  isOpen: boolean;
}

const DiscoverImportWizardInner: React.FC<IDiscoverImportWizard> = ({
  platform,
  onClose,
  isOpen,
}: IDiscoverImportWizard) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);
  const { submitTask } = useStartPlatformApplicationImport();
  const { state, setPlatform, setFilters, setResults, reset } =
    useWizardReducer({ platform });
  const { results, filters } = state;
  const [selectPlatform] = React.useState<boolean>(!platform);

  const handleCancel = () => {
    reset();
    onClose();
  };

  const onSubmitTask = async () => {
    if (!state.platform || !filters.document) {
      return;
    }

    const { success, failure } = await submitTask(
      state.platform,
      filters.document
    );
    setResults({ success, failure });

    if (success.length > 0) {
      pushNotification({
        title: t("platformDiscoverWizard.toast.submittedOk"),
        message: `Task IDs: ${success
          .map((result) => result.task.id)
          .sort(universalComparator)
          .join(", ")}`,
        variant: "info",
      });
    }

    if (failure.length > 0) {
      pushNotification({
        title: t("platformDiscoverWizard.toast.submittedFailed"),
        message: `Platform: ${failure
          .map((result) => result.platform.name)
          .sort(universalComparator)
          .join(", ")}`,
        variant: "danger",
      });
    }
  };

  return (
    <Modal
      variant={ModalVariant.large}
      aria-label={t("platformDiscoverWizard.title")}
      isOpen={isOpen}
      showClose={false}
      hasNoBodyWrapper
      onEscapePress={handleCancel}
    >
      <Wizard
        onClose={handleCancel}
        header={
          <WizardHeader
            onClose={handleCancel}
            title={t("platformDiscoverWizard.title")}
            description={t("platformDiscoverWizard.description")}
          />
        }
        isVisitRequired
      >
        {selectPlatform ? (
          <WizardStep
            id="platform"
            name={t("platformDiscoverWizard.platformSelect.stepTitle")}
            footer={{
              nextButtonText: t("actions.next"),
              backButtonText: t("actions.back"),
              isNextDisabled: state.platform === null,
            }}
          >
            <SelectPlatform
              platform={state.platform}
              onPlatformSelected={setPlatform}
            />
          </WizardStep>
        ) : null}

        <WizardStep
          id="filter-input"
          name={t("platformDiscoverWizard.filterInput.stepTitle")}
          isDisabled={!state.platform}
          footer={{
            nextButtonText: t("actions.next"),
            backButtonText: t("actions.back"),
            isNextDisabled: !filters.isValid,
          }}
        >
          {state.platform ? (
            <FilterInput
              platform={state.platform}
              onFiltersChanged={setFilters}
              initialFilters={filters}
            />
          ) : null}
        </WizardStep>

        <WizardStep
          id="review"
          name={t("platformDiscoverWizard.review.stepTitle")}
          isDisabled={!state.platform || !state.filters.isValid}
          footer={{
            nextButtonText: results
              ? t("actions.close")
              : t("actions.discoverApplications"),
            backButtonText: t("actions.back"),
            isNextDisabled: !state.isReady && !results,
            isBackDisabled: !!results,
            isCancelHidden: !!results,
            onNext: results ? handleCancel : onSubmitTask,
          }}
        >
          {state.platform ? (
            !results ? (
              <Review platform={state.platform} filters={filters} />
            ) : (
              <Results results={results} />
            )
          ) : null}
        </WizardStep>
      </Wizard>
    </Modal>
  );
};
