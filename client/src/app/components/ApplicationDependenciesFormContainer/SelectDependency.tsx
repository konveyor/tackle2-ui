import React from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";

import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";

import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { ApplicationDependency } from "@app/api/models";
import { toRef } from "@app/utils/model-utils";
import {
  useCreateApplicationDependency,
  useDeleteApplicationDependency,
} from "@app/queries/applications";
import { getAxiosErrorMessage } from "@app/utils/utils";

const isEqual = (
  a: OptionWithValue<ApplicationDependency>,
  b: OptionWithValue<ApplicationDependency>
) => {
  return (
    (a.value.id && b.value.id && a.value.id === b.value.id) ||
    (a.value.from.id === b.value.from.id && a.value.to.id === b.value.to.id)
  );
};

export interface SelectDependencyProps {
  fieldId: string;
  toStringFn: (value: ApplicationDependency) => string;

  value: OptionWithValue<ApplicationDependency>[];
  setValue: (value: OptionWithValue<ApplicationDependency>[]) => void;
  options: OptionWithValue<ApplicationDependency>[];

  isFetching: boolean;
  isSaving: boolean;
  toggleAriaLabel?: string;
  toggleId?: string;
  setErrorMsg: (message: string | null) => void;
}

export const SelectDependency: React.FC<SelectDependencyProps> = ({
  fieldId,
  value,
  options,
  isSaving,
  toggleAriaLabel,
  toggleId,
  setErrorMsg,
}) => {
  const { t } = useTranslation();

  const createDependencyMutation = useCreateApplicationDependency({
    onError: (error: AxiosError) => {
      setErrorMsg(getAxiosErrorMessage(error));
    },
    onSuccess: () => {
      setErrorMsg(null);
    },
  });
  const deleteDependencyMutation = useDeleteApplicationDependency();
  return (
    <SimpleSelect
      isDisabled={isSaving}
      value={value}
      onChange={(selection) => {
        const selectionWithValue =
          selection as OptionWithValue<ApplicationDependency>;
        const toApplicationRef = toRef(selectionWithValue.value.to) ?? null;
        const fromApplicationRef = toRef(selectionWithValue.value.from) ?? null;

        const elementExists = value.find((f) => {
          return isEqual(f, selectionWithValue);
        });

        if (!toApplicationRef || !fromApplicationRef) {
          return;
        }

        if (elementExists) {
          deleteDependencyMutation.mutate(elementExists.value.id!);
        } else {
          const newDependency = {
            ...selectionWithValue.value,
            to: toApplicationRef,
            from: fromApplicationRef,
          };

          createDependencyMutation.mutate(newDependency);
        }
      }}
      variant="typeaheadmulti"
      aria-label={fieldId}
      aria-describedby={fieldId}
      placeholderText={t("composed.selectMany", {
        what: t("terms.applications").toLowerCase(),
      })}
      menuAppendTo={() => document.body}
      maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
      options={options}
      noResultsFoundText={t("message.noResultsFoundTitle")}
      toggleAriaLabel={toggleAriaLabel}
      toggleId={toggleId}
    />
  );
};
