import React, { useMemo } from "react";
import { AxiosPromise, AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";
import { useFormik, FormikProvider, FormikHelpers } from "formik";
import { object, string, mixed } from "yup";

import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  NumberInput,
  TextArea,
} from "@patternfly/react-core";

import { SingleSelectOptionValueFormikField } from "@app/shared/components";

import {
  DEFAULT_SELECT_MAX_HEIGHT,
  PROPOSED_ACTION_LIST,
  EFFORT_ESTIMATE_LIST,
} from "@app/Constants";
import {
  getValidatedFromError,
  getValidatedFromErrorTouched,
} from "@app/utils/utils";
import { number } from "yup";
import {
  Application,
  EffortEstimate,
  ProposedAction,
  Review,
} from "@app/api/models";
import { createReview, updateReview } from "@app/api/rest";
import {
  ISimpleOptionDropdown,
  toISimpleOptionDropdownWithValue,
} from "@app/utils/model-utils";

interface SimpleOption<T> {
  key: T;
  name: string;
}

export interface FormValues {
  action: ISimpleOptionDropdown<ProposedAction> | null;
  effort: ISimpleOptionDropdown<EffortEstimate> | null;
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

  const actionOptions: SimpleOption<ProposedAction>[] = useMemo(() => {
    return Object.entries(PROPOSED_ACTION_LIST).map(([key, value]) => ({
      key: key as ProposedAction,
      name: t(value.i18Key),
    }));
  }, [t]);

  const effortOptions: SimpleOption<EffortEstimate>[] = useMemo(() => {
    return Object.entries(EFFORT_ESTIMATE_LIST).map(([key, value]) => ({
      key: key as EffortEstimate,
      name: t(value.i18Key),
    }));
  }, [t]);

  // Formik

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

  const onSubmit = (
    formValues: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => {
    if (!formValues.effort || !formValues.action) {
      console.log("Invalid form");
      return;
    }

    const payload: Review = {
      ...review,
      proposedAction: formValues.action.key,
      effortEstimate: formValues.effort.key,
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
        formikHelpers.setSubmitting(false);
        onSaved(response);
      })
      .catch((error) => {
        formikHelpers.setSubmitting(false);
        // onError(error);
      });
  };

  const actionInitialValue: ISimpleOptionDropdown<ProposedAction> | null =
    useMemo(() => {
      let result: ISimpleOptionDropdown<ProposedAction> | null = null;
      if (review) {
        const exists = actionOptions.find(
          (f) => f.key === review.proposedAction
        );
        result = exists || {
          key: review.proposedAction,
          name: t("terms.unknown"),
        };
      }
      return result;
    }, [review, actionOptions, t]);

  const effortInitialValue: ISimpleOptionDropdown<EffortEstimate> | null =
    useMemo(() => {
      let result: ISimpleOptionDropdown<EffortEstimate> | null = null;
      if (review) {
        const exists = effortOptions.find(
          (f) => f.key === review.effortEstimate
        );
        result = exists || {
          key: review.effortEstimate,
          name: t("terms.unknown"),
        };
      }
      return result;
    }, [review, effortOptions, t]);

  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues: {
      action: actionInitialValue,
      effort: effortInitialValue,
      criticality: review?.businessCriticality || 1,
      priority: review?.workPriority || 1,
      comments: review?.comments || "",
    },
    validationSchema: validationSchema,
    onSubmit: onSubmit,
  });

  return (
    <FormikProvider value={formik}>
      <Form onSubmit={formik.handleSubmit}>
        <FormGroup
          label={t("terms.proposedAction")}
          fieldId="action"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.action)}
          helperTextInvalid={formik.errors.action}
        >
          <SingleSelectOptionValueFormikField<
            ISimpleOptionDropdown<ProposedAction>
          >
            fieldConfig={{ name: "action" }}
            selectConfig={{
              variant: "typeahead",
              "aria-label": "action",
              "aria-describedby": "action",
              placeholderText: t("terms.select"),
              maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
            }}
            options={actionOptions}
            toOptionWithValue={toISimpleOptionDropdownWithValue}
          />
        </FormGroup>
        <FormGroup
          label={t("terms.effortEstimate")}
          fieldId="effort"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.effort)}
          helperTextInvalid={formik.errors.effort}
        >
          <SingleSelectOptionValueFormikField<
            ISimpleOptionDropdown<EffortEstimate>
          >
            fieldConfig={{ name: "effort" }}
            selectConfig={{
              variant: "typeahead",
              "aria-label": "effort",
              "aria-describedby": "effort",
              placeholderText: t("terms.select"),
              maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
            }}
            options={effortOptions}
            toOptionWithValue={toISimpleOptionDropdownWithValue}
          />
        </FormGroup>
        <FormGroup
          label={t("composed.businessCriticality")}
          fieldId="criticality"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.criticality)}
          helperTextInvalid={formik.errors.criticality}
        >
          <NumberInput
            inputName="criticality"
            inputAriaLabel="criticality"
            minusBtnAriaLabel="minus"
            plusBtnAriaLabel="plus"
            value={formik.values.criticality}
            min={1}
            max={10}
            onMinus={() => {
              formik.setFieldValue(
                "criticality",
                (formik.values.criticality || 0) - 1
              );
            }}
            onChange={formik.handleChange}
            onPlus={() => {
              formik.setFieldValue(
                "criticality",
                (formik.values.criticality || 0) + 1
              );
            }}
          />
        </FormGroup>
        <FormGroup
          label={t("composed.workPriority")}
          fieldId="priority"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.priority)}
          helperTextInvalid={formik.errors.priority}
        >
          <NumberInput
            inputName="priority"
            inputAriaLabel="priority"
            minusBtnAriaLabel="minus"
            plusBtnAriaLabel="plus"
            value={formik.values.priority}
            min={1}
            max={10}
            onMinus={() => {
              formik.setFieldValue(
                "priority",
                (formik.values.priority || 0) - 1
              );
            }}
            onChange={formik.handleChange}
            onPlus={() => {
              formik.setFieldValue(
                "priority",
                (formik.values.priority || 0) + 1
              );
            }}
          />
        </FormGroup>
        <FormGroup
          label={t("terms.comments")}
          fieldId="comments"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.comments)}
          helperTextInvalid={formik.errors.comments}
        >
          <TextArea
            type="text"
            name="comments"
            aria-label="comments"
            aria-describedby="comments"
            isRequired={false}
            onChange={(_, event) => formik.handleChange(event)}
            onBlur={formik.handleBlur}
            value={formik.values.comments}
            validated={getValidatedFromErrorTouched(
              formik.errors.comments,
              formik.touched.comments
            )}
            resizeOrientation="vertical"
          />
        </FormGroup>

        <ActionGroup>
          <Button
            type="submit"
            aria-label="submit"
            variant={ButtonVariant.primary}
            isDisabled={
              !formik.isValid ||
              !formik.dirty ||
              formik.isSubmitting ||
              formik.isValidating
            }
          >
            {t("actions.submitReview")}
          </Button>
          <Button
            type="button"
            aria-label="cancel"
            variant={ButtonVariant.link}
            isDisabled={formik.isSubmitting || formik.isValidating}
            onClick={onCancel}
          >
            {t("actions.cancel")}
          </Button>
        </ActionGroup>
      </Form>
    </FormikProvider>
  );
};
