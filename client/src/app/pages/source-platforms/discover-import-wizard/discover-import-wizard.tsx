import * as React from "react";
import {
  Modal,
  ModalVariant,
  Wizard,
  WizardStep,
  WizardHeader,
  Button,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

import { SourcePlatform } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useWizardReducer } from "./useWizardReducer";
import { FilterInput } from "./filter-input";
import { Review } from "./review";
import { Results } from "./results";
import { useStartPlatformApplicationImport } from "./useStartPlatformApplicationImport";

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
  const { state, setFilters, setResults, reset } = useWizardReducer();
  const { results, filters } = state;

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
          .sort()
          .join(", ")}`,
        variant: "info",
      });
    }

    if (failure.length > 0) {
      pushNotification({
        title: t("platformDiscoverWizard.toast.submittedFailed"),
        message: `Platform: ${failure
          .map((result) => result.platform.name)
          .sort()
          .join(", ")}`,
        variant: "danger",
      });
    }
  };

  if (!platform) {
    return (
      <Modal
        variant={ModalVariant.medium}
        title={t("dialog.title.discoverApplications")}
        isOpen={isOpen}
        onClose={handleCancel}
        footer={
          <Button variant="primary" onClick={handleCancel}>
            {t("actions.close")}
          </Button>
        }
      >
        <div style={{ padding: "20px" }}>
          <p>{t("platformDiscoverWizard.noPlatformSelected")}</p>
        </div>
      </Modal>
    );
  }

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
      >
        <WizardStep
          id="filter-input"
          name={t("platformDiscoverWizard.filterInput.stepTitle")}
          footer={{
            nextButtonText: t("actions.next"),
            isNextDisabled: !filters.isValid,
          }}
        >
          <FilterInput platform={platform} onFiltersChanged={setFilters} />
        </WizardStep>

        <WizardStep
          id="review"
          name={t("platformDiscoverWizard.review.stepTitle")}
          footer={{
            nextButtonText: results
              ? t("actions.close")
              : t("actions.discoverApplications"),
            onNext: results ? handleCancel : onSubmitTask,
            isNextDisabled: !state.isReady && !results,
            backButtonText: t("actions.back"),
            isBackDisabled: !!results,
            isCancelHidden: !!results,
          }}
        >
          {!results ? (
            <Review platform={platform} filters={filters} />
          ) : (
            <Results results={results} />
          )}
        </WizardStep>
      </Wizard>
    </Modal>
  );
};
