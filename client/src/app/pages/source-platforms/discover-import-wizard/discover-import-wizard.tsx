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

import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { New, PlatformTask } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useCreateTaskMutation } from "@app/queries/tasks";
import { SourcePlatform } from "@app/api/models";
import { Review } from "./review";
import { Results, ResultsData } from "./results";

// ImportFilter type for platform discovery tasks
export interface ImportFilter {
  // Filter criteria for discovering applications
  includePatterns?: string[];
  excludePatterns?: string[];
  // Additional filter options as needed
}

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

interface IDiscoverImportWizard {
  platform?: SourcePlatform;
  onClose: () => void;
  isOpen: boolean;
}

enum StepId {
  Review = 1,
  Results = 2,
}

export interface FormValues {
  platform: SourcePlatform;
  filters: ImportFilter;
}

const DiscoverImportWizardInner: React.FC<IDiscoverImportWizard> = ({
  platform,
  onClose,
  isOpen,
}: IDiscoverImportWizard) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);
  const { submitTask } = useStartPlatformApplicationDiscover();

  // State to track submission results and current step
  const [submissionResults, setSubmissionResults] =
    React.useState<ResultsData | null>(null);

  const methods = useForm<FormValues>({
    defaultValues: {
      platform: platform!,
      filters: {
        includePatterns: [],
        excludePatterns: [],
      },
    },
    resolver: yupResolver(
      yup.object({
        platform: yup.object().required(),
        filters: yup.object().shape({
          includePatterns: yup.array().of(yup.string()),
          excludePatterns: yup.array().of(yup.string()),
        }),
      })
    ),
    mode: "all",
  });
  const { handleSubmit } = methods;

  const handleCancel = () => {
    setSubmissionResults(null);
    onClose();
  };

  const onSubmit = async ({ platform, filters }: FormValues) => {
    const { success, failure } = await submitTask(platform, filters);

    // Store results and move to Results step
    setSubmissionResults({ success, failure });

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

  const showResults = submissionResults !== null;
  return (
    <FormProvider {...methods}>
      <Modal
        variant={ModalVariant.large}
        aria-label={t("dialog.title.discoverApplications")}
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
              title={t("dialog.title.discoverApplications")}
              description={t("dialog.message.discoverApplications")}
            />
          }
        >
          <WizardStep
            id={StepId.Review}
            name="Review"
            footer={{
              nextButtonText: showResults
                ? t("actions.close")
                : t("actions.discoverApplications"),
              onNext: showResults ? handleCancel : handleSubmit(onSubmit),
              isBackDisabled: showResults,
              isCancelHidden: showResults,
            }}
          >
            {!showResults ? (
              <Review />
            ) : (
              <Results results={submissionResults} />
            )}
          </WizardStep>
        </Wizard>
      </Modal>
    </FormProvider>
  );
};

const useStartPlatformApplicationDiscover = () => {
  const { mutateAsync: createTask } = useCreateTaskMutation<
    ImportFilter,
    PlatformTask<ImportFilter>
  >();

  const createAndSubmitTask = async (
    platform: SourcePlatform,
    filters: ImportFilter
  ): Promise<{
    success?: {
      task: PlatformTask<ImportFilter>;
      platform: SourcePlatform;
    };
    failure?: {
      message: string;
      cause: Error;
      platform: SourcePlatform;
      newTask: New<PlatformTask<ImportFilter>>;
    };
  }> => {
    const newTask: New<PlatformTask<ImportFilter>> = {
      name: `${platform.name}.${platform.id}.platform-discover-import`,
      kind: "platform-discover-import",
      platform: { id: platform.id, name: platform.name },
      state: "Ready",
      data: filters,
    };

    try {
      const task = await createTask(newTask);
      return { success: { task, platform } };
    } catch (error) {
      return {
        failure: {
          message: "Failed to submit the platform application discovery task",
          cause: error as Error,
          platform,
          newTask,
        },
      };
    }
  };

  const submitTask = async (
    platform: SourcePlatform,
    filters: ImportFilter
  ) => {
    const result = await createAndSubmitTask(platform, filters);

    const success = result.success ? [result.success] : [];
    const failure = result.failure ? [result.failure] : [];

    return { success, failure };
  };

  return {
    submitTask,
  };
};
