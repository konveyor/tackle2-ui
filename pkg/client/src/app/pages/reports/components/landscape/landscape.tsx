import React, { useCallback, useContext, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Skeleton, Split, SplitItem } from "@patternfly/react-core";

import { ConditionalRender, StateError } from "@app/shared/components";
import { useFetch } from "@app/shared/hooks";

import { RISK_LIST } from "@app/Constants";
import { AssessmentRisk } from "@app/api/models";
import { getAssessmentLandscape } from "@app/api/rest";

import { ApplicationSelectionContext } from "../../application-selection-context";
import { NoApplicationSelectedEmptyState } from "../no-application-selected-empty-state";
import { Donut } from "./donut";

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

export interface ILandscapeProps {}

export const Landscape: React.FC<ILandscapeProps> = () => {
  const { t } = useTranslation();

  // Context
  const { allItems: applications } = useContext(ApplicationSelectionContext);

  // Data
  const fetchLandscapeData = useCallback(() => {
    if (applications.length > 0) {
      return getAssessmentLandscape(applications.map((f) => f.id!)).then(
        ({ data }) => data
      );
    } else {
      return Promise.resolve([]);
    }
  }, [applications]);

  const {
    data: assessmentRisks,
    isFetching,
    fetchError,
    requestFetch: refreshChart,
  } = useFetch<AssessmentRisk[]>({
    defaultIsFetching: true,
    onFetchPromise: fetchLandscapeData,
  });

  useEffect(() => {
    refreshChart();
  }, [applications, refreshChart]);

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
