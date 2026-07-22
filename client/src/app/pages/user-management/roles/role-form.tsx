import { FC } from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Form } from "@patternfly/react-core";

import { UserRole as Role } from "@app/api/models";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";

import { DualListSelector } from "../../../components/dual-list-selector";
import { useFetchScopes } from "../../../queries/scopes";

export type RoleFormValues = Pick<Role, "name" | "scopes">;

export const ROLE_DEFAULTS: RoleFormValues = { name: "", scopes: [] };

export interface RoleFormProps {
  form: UseFormReturn<RoleFormValues>;
}

export const RoleForm: FC<RoleFormProps> = ({ form }) => {
  const { t } = useTranslation();
  const { control } = form;
  const { scopes: allScopes } = useFetchScopes();

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
        name="scopes"
        label={t("terms.scopes")}
        fieldId="scopes"
        renderInput={({ field: { value: chosenScopes, onChange } }) => {
          return (
            <DualListSelector
              chosenOptions={chosenScopes ?? []}
              onChange={onChange}
              allOptions={(allScopes ?? []).map((scope) => scope.name)}
              allOptionsTitle={t("terms.availableScopes")}
              chosenOptionsTitle={t("terms.chosenScopes")}
            />
          );
        }}
      />
    </Form>
  );
};
