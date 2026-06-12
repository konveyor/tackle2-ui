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
        rules={{
          validate: (value) => {
            // Empty → use server default; that is always valid.
            if (value === "" || value === undefined || value === null) {
              return true;
            }
            const n = Number(value);
            if (!Number.isFinite(n)) {
              return t("message.lifespanMustBeNumber");
            }
            if (!Number.isInteger(n)) {
              return t("message.lifespanMustBeInteger");
            }
            if (n <= 0) {
              return t("message.lifespanMustBePositive");
            }
            return true;
          },
        }}
      />
    </Form>
  );
};
