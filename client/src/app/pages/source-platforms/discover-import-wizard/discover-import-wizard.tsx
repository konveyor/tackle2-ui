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

import {
  JsonDocument,
  New,
  PlatformApplicationImportTask,
  TargetedSchema,
} from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useCreateTaskMutation } from "@app/queries/tasks";
import { useFetchPlatformDiscoveryImportSchema } from "@app/queries/schemas";
import { SourcePlatform } from "@app/api/models";
import { jsonSchemaToYupSchema } from "@app/components/schema-defined-fields/utils";
import { FilterInput } from "./filter-input";
import { Review } from "./review";
import { Results, ResultsData } from "./results";

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
  FilterInput = 1,
  Review = 2,
  Results = 3,
}

export interface FormValues {
  platform: SourcePlatform;
  filtersSchema?: TargetedSchema;
  filtersDocument?: JsonDocument;
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
  const [activeStep, setActiveStep] = React.useState<StepId>(
    StepId.FilterInput
  );

  // Fetch the discovery filters schema for the platform
  const { filtersSchema } = useFetchPlatformDiscoveryImportSchema(
    platform?.kind
  );

  const validationSchema = React.useMemo(() => {
    return yup.object({
      platform: yup.object().required(),
      filtersSchema: yup.object().nullable(),
      filtersDocument: yup
        .object()
        .when("filtersSchema", (filtersSchema: TargetedSchema | undefined) => {
          return filtersSchema
            ? jsonSchemaToYupSchema(filtersSchema.definition, t)
            : yup.object().nullable();
        }),
    });
  }, [t]);

  const methods = useForm<FormValues>({
    defaultValues: {
      platform: platform!,
      filtersSchema: undefined, // will be set by useEffect below
      filtersDocument: {},
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const {
    handleSubmit,
    reset,
    formState: { isValid },
  } = methods;

  // Update form when schema is loaded
  React.useEffect(() => {
    if (filtersSchema) {
      reset({
        ...methods.getValues(),
        filtersSchema: filtersSchema,
        filtersDocument: {},
      });
    } else {
      reset({
        ...methods.getValues(),
        filtersSchema: undefined,
        filtersDocument: undefined,
      });
    }
  }, [filtersSchema, reset, methods]);

  const handleCancel = () => {
    setSubmissionResults(null);
    setActiveStep(StepId.FilterInput);
    onClose();
  };

  const onSubmit = async ({ platform, filtersDocument }: FormValues) => {
    const { success, failure } = await submitTask(platform, filtersDocument);

    // Store results and move to Results step
    setSubmissionResults({ success, failure });
    setActiveStep(StepId.Results);

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
            id={StepId.FilterInput}
            name={t("platformDiscoverWizard.filterInput.title")}
            footer={{
              nextButtonText: t("actions.next"),
              onNext: () => setActiveStep(StepId.Review),
              isNextDisabled: !isValid || !filtersSchema,
              isCancelHidden: showResults,
            }}
            isHidden={activeStep !== StepId.FilterInput || showResults}
          >
            <FilterInput />
          </WizardStep>

          <WizardStep
            id={StepId.Review}
            name={t("platformDiscoverWizard.review.title")}
            footer={{
              nextButtonText: showResults
                ? t("actions.close")
                : t("actions.discoverApplications"),
              onNext: showResults ? handleCancel : handleSubmit(onSubmit),
              backButtonText: t("actions.back"),
              onBack: () => setActiveStep(StepId.FilterInput),
              isBackDisabled: showResults,
              isCancelHidden: showResults,
            }}
            isHidden={activeStep !== StepId.Review && !showResults}
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
    JsonDocument,
    PlatformApplicationImportTask
  >();

  const createAndSubmitTask = async (
    platform: SourcePlatform,
    filters?: JsonDocument
  ): Promise<{
    success?: {
      task: PlatformApplicationImportTask;
      platform: SourcePlatform;
    };
    failure?: {
      message: string;
      cause: Error;
      platform: SourcePlatform;
      newTask: New<PlatformApplicationImportTask>;
    };
  }> => {
    const newTask: New<PlatformApplicationImportTask> = {
      name: `${platform.name}.${platform.id}.application-import`,
      kind: "application-import",
      platform: { id: platform.id, name: platform.name },
      state: "Ready",
      data: filters || {},
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
    filters?: JsonDocument
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
