import * as React from "react";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";
import { TextContent, Text } from "@patternfly/react-core";

import { SchemaDefinedField } from "@app/components/schema-defined-fields/SchemaDefinedFields";
import { FormValues } from "./discover-import-wizard";

export const FilterInput: React.FC = () => {
  const { t } = useTranslation();
  const { watch, setValue } = useFormContext<FormValues>();

  const platform = watch("platform");
  const filtersSchema = watch("filtersSchema");
  const filtersDocument = watch("filtersDocument");

  return (
    <div>
      <TextContent style={{ marginBottom: "var(--pf-v5-global--spacer--lg)" }}>
        <Text component="h3">
          {t("platformDiscoverWizard.filterInput.title")}
        </Text>
        <Text component="p">
          {t("platformDiscoverWizard.filterInput.description", {
            platformName: platform?.name,
            platformKind: platform?.kind,
          })}
        </Text>
      </TextContent>

      {!platform ? (
        <div style={{ padding: "20px" }}>
          <Text>{t("platformDiscoverWizard.noPlatformSelected")}</Text>
        </div>
      ) : !filtersSchema ? (
        <div style={{ padding: "20px" }}>
          <Text>
            {t("platformDiscoverWizard.filterInput.noFiltersAvailable", {
              platformKind: platform.kind,
            })}
          </Text>
        </div>
      ) : (
        <SchemaDefinedField
          key={platform.kind}
          id="platform-discovery-filters"
          jsonDocument={filtersDocument ?? {}}
          jsonSchema={filtersSchema.definition}
          onDocumentChanged={(newFiltersDocument) => {
            setValue("filtersDocument", newFiltersDocument, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }}
        />
      )}
    </div>
  );
};
