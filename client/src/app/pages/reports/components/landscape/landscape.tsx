import React, { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Skeleton, Split, SplitItem } from "@patternfly/react-core";

import { ConditionalRender } from "@app/components/ConditionalRender";
import { StateError } from "@app/components/StateError";

import { RISK_LIST } from "@app/Constants";
import { Assessment, AssessmentRisk } from "@app/api/models";

import { ApplicationSelectionContext } from "../../application-selection-context";
import { NoApplicationSelectedEmptyState } from "../no-application-selected-empty-state";
import { Donut } from "./donut";
import { useFetchRisks } from "@app/queries/risks";

interface ILandscapeData {
  low: number;
  medium: number;
  high: number;
  unassessed: number;
}

const extractLandscapeData = (
  totalApps: number,
  data: AssessmentRisk[]
): ILandscapeData => {
  let low = 0;
  let medium = 0;
  let high = 0;
  let unassessed = 0;

  data.forEach((elem) => {
    switch (elem.risk) {
      case "green":
        low++;
        break;
      case "yellow":
        medium++;
        break;
      case "red":
        high++;
        break;
    }
  });

  unassessed = totalApps - low - medium - high;
  return { low, medium, high, unassessed };
};

interface ILandscapeProps {
  assessments: Assessment[];
}

export const Landscape: React.FC<ILandscapeProps> = ({ assessments }) => {
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
              value={landscapeData.high}
              total={applications.length}
              color={RISK_LIST["red"].hexColor}
              riskLabel={t("colors.red")}
              // riskDescription={}
            />
          </SplitItem>
          <SplitItem>
            <Donut
              value={landscapeData.medium}
              total={applications.length}
              color={RISK_LIST["yellow"].hexColor}
              riskLabel={t("colors.yellow")}
              // riskDescription={}
            />
          </SplitItem>
          <SplitItem>
            <Donut
              value={landscapeData.high}
              total={applications.length}
              color={RISK_LIST["green"].hexColor}
              riskLabel={t("colors.green")}
              // riskDescription={}
            />
          </SplitItem>
          <SplitItem>
            <Donut
              value={landscapeData.unassessed}
              total={applications.length}
              color={RISK_LIST["unknown"].hexColor}
              riskLabel={`${t("terms.unassessed")}/${t("terms.unknown")}`}
              // riskDescription={}
            />
          </SplitItem>
        </Split>
      )}
    </ConditionalRender>
  );
};
