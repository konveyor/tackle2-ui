import { FC } from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Form } from "@patternfly/react-core";

import { MultiSelect } from "@app/components/FilterToolbar/components/MultiSelect";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { ScopeGate, rolesReadScopes } from "@app/scopes";

import { useFetchRoles } from "../roles/use-roles";

import { UserFormValues } from "./use-user-form";

export interface UserFormProps {
  form: UseFormReturn<UserFormValues>;
  isEdit: boolean;
  isSeeded: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const UserForm: FC<UserFormProps> = ({ form, isEdit, isSeeded }) => {
  const { t } = useTranslation();
  const { control } = form;
  const { roles } = useFetchRoles();

  const roleOptions = roles.map((role) => ({
    value: role.name,
    label: role.name,
  }));

  return (
    <Form>
      <HookFormPFTextInput
        control={control}
        name="login"
        label={t("terms.login")}
        fieldId="login"
        isRequired
        isDisabled={isEdit}
      />
      <HookFormPFTextInput
        control={control}
        name="name"
        label={t("terms.name")}
        fieldId="name"
        isRequired
      />
      <HookFormPFTextInput
        control={control}
        name="email"
        label={t("terms.email")}
        fieldId="email"
        isRequired
      />
      <HookFormPFTextInput
        control={control}
        name="password"
        label={t("terms.password")}
        fieldId="password"
        type="password"
        isRequired={!isEdit}
        helperText={t("message.passwordMaxLength")}
      />
      <HookFormPFTextInput
        control={control}
        name="confirmPassword"
        label={t("terms.confirmPassword")}
        fieldId="confirmPassword"
        type="password"
        isRequired={!isEdit}
      />
      <ScopeGate requiredScopes={rolesReadScopes}>
        <HookFormPFGroupController
          key={roles.map((r) => r.id).join("_")}
          control={control}
          name="roles"
          label={t("terms.roles")}
          fieldId="roles"
          helperText={
            isSeeded ? t("message.seededUserRolesReadOnly") : undefined
          }
          renderInput={({ field: { value, onChange } }) => {
            const selectedNames = (value ?? []).map(
              (r) => r.name ?? String(r.id)
            );
            return (
              <MultiSelect
                toggleId="roles-select-toggle"
                toggleAriaLabel="Roles select dropdown toggle"
                hasChips
                isDisabled={isSeeded}
                values={selectedNames}
                options={roleOptions}
                placeholderText={t("composed.selectMany", {
                  what: t("terms.roles").toLowerCase(),
                })}
                onSelect={(selection) => {
                  if (!selection) return;
                  const current = value ?? [];
                  const exists = current.find((r) => r.name === selection);
                  if (exists) {
                    onChange(current.filter((r) => r.name !== selection));
                  } else {
                    const role = roles.find((r) => r.name === selection);
                    if (role) {
                      onChange([...current, { id: role.id, name: role.name }]);
                    }
                  }
                }}
                onClear={() => onChange([])}
              />
            );
          }}
        />
      </ScopeGate>
    </Form>
  );
};
