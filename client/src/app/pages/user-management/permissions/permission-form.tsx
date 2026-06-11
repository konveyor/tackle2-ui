import { FC } from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Form } from "@patternfly/react-core";

import { HookFormPFTextInput } from "@app/components/HookFormPFFields";

import { Permission } from "../types";

export type PermissionFormValues = Pick<Permission, "name" | "scope">;

export const PERMISSION_DEFAULTS: PermissionFormValues = {
  name: "",
  scope: "",
};

export interface PermissionFormProps {
  form: UseFormReturn<PermissionFormValues>;
}

export const PermissionForm: FC<PermissionFormProps> = ({ form }) => {
  const { t } = useTranslation();
  const { control } = form;

  return (
    <Form>
      <HookFormPFTextInput
        control={control}
        name="name"
        label={t("terms.name")}
        fieldId="name"
        isRequired
      />
      <HookFormPFTextInput
        control={control}
        name="scope"
        label={t("terms.scope")}
        fieldId="scope"
        isRequired
        helperText={t("message.permissionScopeHint")}
      />
    </Form>
  );
};
