import { FC } from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Form } from "@patternfly/react-core";

import { HookFormPFTextInput } from "@app/components/HookFormPFFields";

export interface TokenFormValues {
  /** Hours as a positive integer, or empty string to use the server default (~87 600 h). */
  lifespan: number | "";
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
