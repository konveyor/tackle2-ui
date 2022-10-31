import React, { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Skeleton, Split, SplitItem } from "@patternfly/react-core";

import { ConditionalRender, StateError } from "@app/shared/components";

import { RISK_LIST } from "@app/Constants";
import { AssessmentRisk } from "@app/api/models";

import { ApplicationSelectionContext } from "../../application-selection-context";
import { NoApplicationSelectedEmptyState } from "../no-application-selected-empty-state";
import { Donut } from "./donut";
import { useFetchRisks } from "@app/queries/risks";

interface ILandscapeData {
  low: number;
  medium: number;
  high: number;
  unassesed: number;
}

const extractLandscapeData = (
  totalApps: number,
  data: AssessmentRisk[]
): ILandscapeData => {
  let low = 0;
  let medium = 0;
  let high = 0;
  let unassesed = 0;

  data.forEach((elem) => {
    switch (elem.risk) {
      case "GREEN":
        low++;
        break;
      case "AMBER":
        medium++;
        break;
      case "RED":
        high++;
        break;
    }
  });

  unassesed = totalApps - low - medium - high;
  return { low, medium, high, unassesed };
};

export const Landscape: React.FC = () => {
  const { t } = useTranslation();

  // Context
  const { allItems: applications } = useContext(ApplicationSelectionContext);

  const {
    risks: assessmentRisks,
    isFetching,
    error: fetchError,
  } = useFetchRisks(applications.map((app) => app.id!));

  const landscapeData = useMemo(() => {
    if (applications.length > 0 && assessmentRisks) {
      return extractLandscapeData(applications.length, assessmentRisks);
    } else {
      return undefined;
    }
  }, [applications, assessmentRisks]);

  if (fetchError) {
    return <StateError />;
  }

  if (!isFetching && !landscapeData) {
    return <NoApplicationSelectedEmptyState />;
  }

  return (
    <ConditionalRender
      when={isFetching}
      then={
        <div style={{ height: 200, width: 400 }}>
          <Skeleton height="75%" width="100%" />
        </div>
      }
    >
      {landscapeData && (
        <Split hasGutter>
          <SplitItem>
            <Donut
              value={landscapeData.low}
              total={applications.length}
              color={RISK_LIST["GREEN"].hexColor}
              riskLabel={t("terms.lowRisk")}
              riskDescription={t("terms.cloudNativeReady")}
            />
          </SplitItem>
          <SplitItem>
            <Donut
              value={landscapeData.medium}
              total={applications.length}
              color={RISK_LIST["AMBER"].hexColor}
              riskLabel={t("terms.mediumRisk")}
              riskDescription={t("terms.modernizable")}
            />
          </SplitItem>
          <SplitItem>
            <Donut
              value={landscapeData.high}
              total={applications.length}
              color={RISK_LIST["RED"].hexColor}
              riskLabel={t("terms.highRisk")}
              riskDescription={t("terms.unsuitableForContainers")}
            />
          </SplitItem>
          <SplitItem>
            <Donut
              value={landscapeData.unassesed}
              total={applications.length}
              color={RISK_LIST["UNKNOWN"].hexColor}
              riskLabel={t("terms.unassesed")}
              riskDescription={t("terms.notYetAssessed")}
            />
          </SplitItem>
        </Split>
      )}
    </ConditionalRender>
  );
};
