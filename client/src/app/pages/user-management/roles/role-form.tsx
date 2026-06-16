import { FC } from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Form } from "@patternfly/react-core";

import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";

import { useFetchPermissions } from "../permissions/use-permissions";
import { Role } from "../types";

import { DualPermissionsList } from "./dual-permissions-list";

export type RoleFormValues = Pick<Role, "name" | "permissions">;

export const ROLE_DEFAULTS: RoleFormValues = { name: "", permissions: [] };

export interface RoleFormProps {
  form: UseFormReturn<RoleFormValues>;
}

export const RoleForm: FC<RoleFormProps> = ({ form }) => {
  const { t } = useTranslation();
  const { control } = form;
  const { permissions: allPermissions } = useFetchPermissions();

  return (
    <Form>
      <HookFormPFTextInput
        control={control}
        name="name"
        label={t("terms.name")}
        fieldId="name"
        isRequired
      />
      <HookFormPFGroupController
        control={control}
        name="permissions"
        label={t("terms.permissions")}
        fieldId="permissions"
        renderInput={({ field: { value: chosenRefs, onChange } }) => {
          return (
            <DualPermissionsList
              chosenRefs={chosenRefs}
              onChange={onChange}
              allPermissions={allPermissions}
            />
          );
        }}
      />
    </Form>
  );
};
