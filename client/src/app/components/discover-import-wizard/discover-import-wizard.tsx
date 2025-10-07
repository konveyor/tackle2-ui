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
import { SourcePlatformRequired } from "./source-platform-required";
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
  platform: initialPlatform,
  onClose,
  isOpen,
}: IDiscoverImportWizard) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);
  const { submitTask } = useStartPlatformApplicationImport();
  const { state, setPlatform, setFilters, setResults, reset } =
    useWizardReducer((initial) => {
      initial.platform = initialPlatform ?? null;
    });
  const { platform, results, filters, isReady } = state;

  const handleCancel = () => {
    reset();
    onClose();
  };

  const onSubmitTask = async () => {
    if (!platform || !filters.document) {
      return;
    }

    const { success, failure } = await submitTask(platform, filters.document);
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
        {!initialPlatform ? (
          <WizardStep
            id="platform"
            name={t("platformDiscoverWizard.platformSelect.stepTitle")}
            footer={{
              nextButtonText: t("actions.next"),
              backButtonText: t("actions.back"),
              isNextDisabled: platform === null,
            }}
          >
            <SelectPlatform
              platform={platform}
              onPlatformSelected={setPlatform}
            />
          </WizardStep>
        ) : null}

        <WizardStep
          id="filter-input"
          name={t("platformDiscoverWizard.filterInput.stepTitle")}
          isDisabled={!platform}
          footer={{
            nextButtonText: t("actions.next"),
            backButtonText: t("actions.back"),
            isNextDisabled: !filters.isValid,
          }}
        >
          {!platform ? (
            <SourcePlatformRequired
              title={t("platformDiscoverWizard.filterInput.title")}
            />
          ) : (
            <FilterInput
              platform={platform}
              onFiltersChanged={setFilters}
              initialFilters={filters}
            />
          )}
        </WizardStep>

        <WizardStep
          id="review"
          name={t("platformDiscoverWizard.review.stepTitle")}
          isDisabled={!platform || !filters.isValid}
          footer={{
            nextButtonText: results
              ? t("actions.close")
              : t("actions.discoverApplications"),
            backButtonText: t("actions.back"),
            isNextDisabled: !isReady && !results,
            isBackDisabled: !!results,
            isCancelHidden: !!results,
            onNext: results ? handleCancel : onSubmitTask,
          }}
        >
          {!platform ? (
            <SourcePlatformRequired
              title={t("platformDiscoverWizard.review.title")}
            />
          ) : null}

          {platform && !results ? (
            <Review platform={platform} filters={filters} />
          ) : null}

          {platform && results ? <Results results={results} /> : null}
        </WizardStep>
      </Wizard>
    </Modal>
  );
};
