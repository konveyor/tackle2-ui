import {
  FieldPath,
  FieldPathValue,
  FieldValues,
  Path,
  useForm,
  useWatch,
} from "react-hook-form";

import { Repository } from "@app/api/models";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import { RepositoryKind } from "@app/hooks/useRepositoryKind";
import { toOptionLike } from "@app/utils/model-utils";

import { isNotEmptyString } from "./model-utils";

/**
 * Type constraint to ensure the prefix points to a Repository field in TFormValues
 */
type RepositoryFieldPath<TFormValues extends FieldValues> = {
  [K in FieldPath<TFormValues>]: FieldPathValue<TFormValues, K> extends
    | Repository<RepositoryKind>
    | undefined
    ? K
    : never;
}[FieldPath<TFormValues>];

export interface RepositoryFieldsProps<TFormValues extends FieldValues> {
  form: ReturnType<typeof useForm<TFormValues>>;
  /**
   * The field path in TFormValues that points to a Repository object.
   * TypeScript will ensure this path points to a Repository or Repository | undefined field.
   */
  prefix: RepositoryFieldPath<TFormValues>;
  kindOptions: OptionWithValue<RepositoryKind>[];
  labels: {
    type: string;
    url: string;
    branch: string;
    path: string;
  };
  fieldIds?: {
    type?: string;
    url?: string;
    branch?: string;
    path?: string;
  };
  toggleIds?: {
    type?: string;
  };
}

export const RepositoryFields = <TFormValues extends FieldValues>({
  form,
  prefix,
  kindOptions,
  labels,
  fieldIds = {},
  toggleIds = {},
}: RepositoryFieldsProps<TFormValues>) => {
  const { control, trigger } = form;

  const nameKind = `${prefix}.kind` as Path<TFormValues>;
  const nameUrl = `${prefix}.url` as Path<TFormValues>;
  const nameBranch = `${prefix}.branch` as Path<TFormValues>;
  const namePath = `${prefix}.path` as Path<TFormValues>;

  const watchRepo = useWatch({
    control,
    name: prefix as Path<TFormValues>,
  }) as Repository<RepositoryKind> | undefined;

  const isTypeRequired =
    isNotEmptyString(watchRepo?.url) ||
    isNotEmptyString(watchRepo?.branch) ||
    isNotEmptyString(watchRepo?.path);
  const isUrlRequired =
    isNotEmptyString(watchRepo?.branch) || isNotEmptyString(watchRepo?.path);

  return (
    <>
      <HookFormPFGroupController
        control={control}
        name={nameKind}
        label={labels.type}
        fieldId={fieldIds.type || `${prefix}-type-select`}
        aria-label={`${prefix} repository type`}
        isRequired={isTypeRequired}
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            toggleId={toggleIds.type || `${prefix}-repo-type-toggle`}
            toggleAriaLabel="Type select dropdown toggle"
            aria-label={name}
            value={value ? toOptionLike(value, kindOptions) : undefined}
            options={kindOptions}
            onChange={(selection) => {
              const selectionValue = selection as OptionWithValue<string>;
              onChange(selectionValue.value);
              trigger(nameUrl);
            }}
          />
        )}
      />
      <HookFormPFTextInput
        control={control}
        type="text"
        aria-label={`${prefix} repository url`}
        name={nameUrl}
        label={labels.url}
        fieldId={fieldIds.url || `${prefix}-repository-url`}
        isRequired={isUrlRequired}
      />
      <HookFormPFTextInput
        control={control}
        type="text"
        aria-label="Repository branch"
        name={nameBranch}
        label={labels.branch}
        fieldId={fieldIds.branch || `${prefix}-branch`}
      />
      <HookFormPFTextInput
        control={control}
        type="text"
        aria-label={`${prefix} repository root path`}
        name={namePath}
        label={labels.path}
        fieldId={fieldIds.path || `${prefix}-path`}
      />
    </>
  );
};
