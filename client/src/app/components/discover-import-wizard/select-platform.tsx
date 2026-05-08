import * as React from "react";
import { useTranslation } from "react-i18next";
import { Form, Content, Content } from "@patternfly/react-core";

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
      <Content style={{ marginBottom: "var(--pf-t--global--spacer--lg)" }}>
        <Content component="h3">
          {t("platformDiscoverWizard.platformSelect.title")}
        </Content>
        <Content component="p">
          {t("platformDiscoverWizard.platformSelect.description")}
        </Content>
      </Content>

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
          toggleAriaLabel="Platform select dropdown toggle"
          ariaLabel="Platform select"
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
