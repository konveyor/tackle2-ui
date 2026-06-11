import { FC } from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Form } from "@patternfly/react-core";

import { HookFormPFTextInput } from "@app/components/HookFormPFFields";

export interface TokenFormValues {
  lifespan: string; // hours as a string; empty = server default (~87 600 h)
}

export const TOKEN_FORM_DEFAULTS: TokenFormValues = { lifespan: "" };

export interface TokenFormProps {
  form: UseFormReturn<TokenFormValues>;
}

export const TokenForm: FC<TokenFormProps> = ({ form }) => {
  const { t } = useTranslation();
  const { control } = form;

  return (
    <Form>
      <HookFormPFTextInput
        control={control}
        name="lifespan"
        label={t("terms.tokenLifespan")}
        fieldId="lifespan"
        type="number"
        helperText={t("message.tokenLifespanHint")}
      />
    </Form>
  );
};
