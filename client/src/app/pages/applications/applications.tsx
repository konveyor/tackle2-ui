import { lazy } from "react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Level, LevelItem, PageSection, Title } from "@patternfly/react-core";

const ApplicationsTable = lazy(() => import("./applications-table"));

export const Applications: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageSection>
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
