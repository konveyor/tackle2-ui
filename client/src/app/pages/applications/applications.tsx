import React, { lazy } from "react";
import {
  Level,
  LevelItem,
  PageSection,
  PageSectionVariants,
  Title,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

const ApplicationsTable = lazy(() => import("./applications-table"));

export const Applications: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <Level>
          <LevelItem>
            <Title headingLevel="h1">
              {t("composed.applicationInventory")}
            </Title>
          </LevelItem>
        </Level>
      </PageSection>
      <PageSection>
        <ApplicationsTable />
      </PageSection>
    </>
  );
};
