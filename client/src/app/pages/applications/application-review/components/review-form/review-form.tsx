import React, { useMemo } from "react";
import { AxiosPromise, AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";
import { object, string, mixed } from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
  NumberInput,
} from "@patternfly/react-core";

import { PROPOSED_ACTION_LIST, EFFORT_ESTIMATE_LIST } from "@app/Constants";
import { number } from "yup";
import {
  Application,
  EffortEstimate,
  ProposedAction,
  Review,
} from "@app/api/models";
import { createReview, updateReview } from "@app/api/rest";
import { FieldErrors, useForm } from "react-hook-form";
import {
  HookFormPFGroupController,
  HookFormPFTextArea,
} from "@app/components/HookFormPFFields";
import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";

export interface FormValues {
  action: ProposedAction;
  effort: EffortEstimate;
  criticality?: number;
  priority?: number;
  comments: string;
}

export interface IReviewFormProps {
  application: Application;
  review?: Review;
  onSaved: (response: AxiosResponse<Review>) => void;
  onCancel: () => void;
}

export const ReviewForm: React.FC<IReviewFormProps> = ({
  application,
  review,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  const actionOptions: OptionWithValue<ProposedAction>[] = useMemo(() => {
    return Object.entries(PROPOSED_ACTION_LIST).map(([key, value]) => ({
      value: key as ProposedAction,
      toString: () => t(value.i18Key),
    }));
  }, [t]);

  const effortOptions: OptionWithValue<EffortEstimate>[] = useMemo(() => {
    return Object.entries(EFFORT_ESTIMATE_LIST).map(([key, value]) => ({
      value: key as EffortEstimate,
      toString: () => t(value.i18Key),
    }));
  }, [t]);

  const validationSchema = object().shape({
    action: mixed().required(t("validation.required")),
    effort: mixed().required(t("validation.required")),
    criticality: number()
      .required(t("validation.required"))
      .min(1, t("validation.min", { value: 1 }))
      .max(10, t("validation.max", { value: 10 })),
    priority: number()
      .required(t("validation.required"))
      .min(1, t("validation.min", { value: 1 }))
      .max(10, t("validation.max", { value: 10 })),
    comments: string()
      .trim()
      .max(1024, t("validation.maxLength", { length: 1024 })),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,
  } = useForm<FormValues>({
    defaultValues: {
      action: review?.proposedAction,
      effort: review?.effortEstimate,
      criticality: review?.businessCriticality || 1,
      priority: review?.workPriority || 1,
      comments: review?.comments || "",
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const onInvalid = (errors: FieldErrors<FormValues>) => {
    console.log("Invalid form", errors);
  };

  const onSubmit = (formValues: FormValues) => {
    const payload: Review = {
      ...review,
      proposedAction: formValues.action,
      effortEstimate: formValues.effort,
      businessCriticality: formValues.criticality || 0,
      workPriority: formValues.priority || 0,
      comments: formValues.comments.trim(),
      application: { ...application, review: undefined },
    };

    let promise: AxiosPromise<Review>;
    if (review) {
      promise = updateReview({
        ...review,
        ...payload,
      });
    } else {
      promise = createReview(payload);
    }

    promise
      .then((response) => {
        onSaved(response);
      })
      .catch((error) => {});
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit, onInvalid)}>
      <HookFormPFGroupController
        control={control}
        name="action"
        label={t("terms.proposedAction")}
        fieldId="action"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            variant="typeahead"
            id="action-select"
            toggleId="action-select-toggle"
            toggleAriaLabel="Action select dropdown toggle"
            aria-label={name}
            value={value}
            options={actionOptions}
            onChange={(selection) => {
              const selectionValue =
                selection as OptionWithValue<ProposedAction>;
              onChange(selectionValue.value);
            }}
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="effort"
        label={t("terms.effortEstimate")}
        fieldId="effort"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            variant="typeahead"
            id="effort-select"
            toggleId="effort-select-toggle"
            toggleAriaLabel="Effort select dropdown toggle"
            aria-label={name}
            value={value}
            options={effortOptions}
            onChange={(selection) => {
              const selectionValue =
                selection as OptionWithValue<EffortEstimate>;
              onChange(selectionValue.value);
            }}
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="criticality"
        label={t("composed.businessCriticality")}
        fieldId="criticality"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <NumberInput
            inputName={name}
            inputAriaLabel="criticality"
            minusBtnAriaLabel="minus"
            plusBtnAriaLabel="plus"
            value={value}
            min={1}
            max={10}
            onMinus={() => {
              onChange((value || 0) - 1);
            }}
            onChange={() => onChange}
            onPlus={() => {
              onChange((value || 0) + 1);
            }}
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="priority"
        label={t("composed.workPriority")}
        fieldId="priority"
        isRequired
        renderInput={({ field: { value, name, onChange } }) => (
          <NumberInput
            inputName="priority"
            inputAriaLabel="priority"
            minusBtnAriaLabel="minus"
            plusBtnAriaLabel="plus"
            value={value}
            min={1}
            max={10}
            onMinus={() => {
              onChange((value || 0) - 1);
            }}
            onChange={() => onChange}
            onPlus={() => {
              onChange((value || 0) + 1);
            }}
          />
        )}
      />
      <HookFormPFTextArea
        control={control}
        name="comments"
        label={t("terms.comments")}
        fieldId="comments"
        resizeOrientation="vertical"
      />

      <ActionGroup>
        <Button
          type="submit"
          id="submit"
          aria-label="submit"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {t("actions.submitReview")}
        </Button>
        <Button
          type="button"
          id="cancel"
          aria-label="cancel"
          variant={ButtonVariant.link}
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
          onClick={onCancel}
        >
          {t("actions.cancel")}
        </Button>
      </ActionGroup>
    </Form>
  );
};
