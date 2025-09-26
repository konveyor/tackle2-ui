import React from "react";
import { useTranslation } from "react-i18next";
import { Form, Text, TextContent } from "@patternfly/react-core";

import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { SourcePlatform } from "@app/api/models";
import { useFetchPlatforms } from "@app/queries/platforms";
import { toOptionLike } from "@app/utils/model-utils";

import { OptionWithValue, SimpleSelect } from "../SimpleSelect";

export interface SelectPlatformProps {
  platform: SourcePlatform | null;
  onPlatformSelected: (platform: SourcePlatform | null) => void;
}

export const SelectPlatform: React.FC<SelectPlatformProps> = ({
  platform,
  onPlatformSelected,
}) => {
  const { t } = useTranslation();
  const { platforms } = useFetchPlatforms();
  const platformOptions = React.useMemo(
    () =>
      platforms.map((platform) => ({
        value: platform,
        toString: () => platform.name,
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
        <SimpleSelect
          maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
          placeholderText={t("composed.selectOne", {
            what: t("terms.platform").toLowerCase(),
          })}
          variant="typeahead"
          toggleId="platform-select-toggle"
          id="platform-select"
          toggleAriaLabel="Platform select dropdown toggle"
          aria-label="platform-select"
          value={platform ? toOptionLike(platform, platformOptions) : undefined}
          options={platformOptions}
          onChange={(selection) => {
            const selectionValue = selection as OptionWithValue<SourcePlatform>;
            onPlatformSelected(selectionValue.value);
          }}
          onClear={() => onPlatformSelected(null)}
        />
      </Form>
    </div>
  );
};
