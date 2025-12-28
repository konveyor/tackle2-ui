import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Text,
  TextContent,
} from "@patternfly/react-core";

import { SourcePlatform } from "@app/api/models";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { SchemaDefinedField } from "@app/components/schema-defined-fields";
import { usePlatformKindList } from "@app/hooks/usePlatformKindList";

import { FilterState } from "./filter-input";
import { ReviewInputCloudFoundry } from "./review-input-cloudfoundry";
import { useCloudFoundryCheck } from "./validate-cloudfoundry-schema";

export const Review: React.FC<{
  platform: SourcePlatform;
  filters: FilterState;
}> = ({ platform, filters }) => {
  const { t } = useTranslation();
  const { getDisplayLabel } = usePlatformKindList();

  const showFilters =
    filters.filterRequired && filters.schema && filters.document;

  const shouldUseCloudFoundryReview = useCloudFoundryCheck(
    platform,
    filters.schema
  );

  return (
    <div>
      <TextContent style={{ marginBottom: "var(--pf-v5-global--spacer--lg)" }}>
        <Text component="h3">{t("platformDiscoverWizard.review.title")}</Text>
        <Text component="p">
          {t("platformDiscoverWizard.review.description", {
            platformName: platform?.name,
          })}
        </Text>
      </TextContent>

      <DescriptionList isHorizontal>
        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.platform")}</DescriptionListTerm>
          <DescriptionListDescription>
            {platform?.name}
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.platformKind")}</DescriptionListTerm>
          <DescriptionListDescription>
            {getDisplayLabel(platform?.kind)}
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.url")}</DescriptionListTerm>
          <DescriptionListDescription>
            {platform?.url || <EmptyTextMessage />}
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.credentials")}</DescriptionListTerm>
          <DescriptionListDescription>
            {platform?.identity?.name || (
              <EmptyTextMessage message={t("terms.none")} />
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>

        {showFilters && (
          <DescriptionListGroup>
            <DescriptionListTerm>
              {t("platformDiscoverWizard.review.discoveryFilters")}
            </DescriptionListTerm>
            <DescriptionListDescription>
              <div
                style={{
                  border: "1px solid var(--pf-v5-global--BorderColor--100)",
                  borderRadius: "3px",
                  padding: "16px",
                }}
              >
                {shouldUseCloudFoundryReview ? (
                  <ReviewInputCloudFoundry
                    id="platform-discovery-filters-review"
                    values={filters.document}
                  />
                ) : (
                  <SchemaDefinedField
                    id="platform-discovery-filters-review"
                    jsonDocument={filters.document ?? {}}
                    jsonSchema={filters.schema?.definition}
                    isReadOnly={true}
                  />
                )}
              </div>
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}
      </DescriptionList>
    </div>
  );
};
