import * as React from "react";
import { useTranslation } from "react-i18next";
import { Form, Text, TextContent } from "@patternfly/react-core";

import { SourcePlatform } from "@app/api/models";
import { FilterSelectOptionProps } from "@app/components/FilterToolbar/FilterToolbar";
import TypeaheadSelect from "@app/components/FilterToolbar/components/TypeaheadSelect";
import { useFetchPlatforms } from "@app/queries/platforms";

export interface SelectPlatformProps {
  platform: SourcePlatform | null;
  onPlatformSelected: (platform: SourcePlatform | null) => void;
}

export const SelectPlatform: React.FC<SelectPlatformProps> = ({
  platform,
  onPlatformSelected,
}) => {
  const { t } = useTranslation();
  const { platforms, isLoading } = useFetchPlatforms();
  const platformOptions: FilterSelectOptionProps[] = React.useMemo(
    () =>
      platforms.map((p) => ({
        value: p.name,
        label: p.name,
      })),
    [platforms]
  );

  return (
    <div>
      <TextContent style={{ marginBottom: "var(--pf-v5-global--spacer--lg)" }}>
        <Text component="h3">
          {t("platformDiscoverWizard.platformSelect.title")}
        </Text>
        <Text component="p">
          {t("platformDiscoverWizard.platformSelect.description")}
        </Text>
      </TextContent>

      <Form id="platform-select-form">
        <TypeaheadSelect
          placeholderText={
            isLoading
              ? t("message.loadingTripleDot")
              : t("composed.selectOne", {
                  what: t("terms.platform").toLowerCase(),
                })
          }
          isDisabled={isLoading}
          toggleId="platform-select-toggle"
          id="platform-select"
          toggleAriaLabel="Platform select dropdown toggle"
          ariaLabel="platform-select"
          categoryKey="platform"
          value={platform?.name}
          options={platformOptions}
          onSelect={(selectedName) =>
            onPlatformSelected(
              selectedName
                ? (platforms.find((p) => p.name === selectedName) ?? null)
                : null
            )
          }
        />
      </Form>
    </div>
  );
};
