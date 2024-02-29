import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Flex, FlexItem, Skeleton } from "@patternfly/react-core";

import { RISK_LIST } from "@app/Constants";
import {
  Application,
  AssessmentWithArchetypeApplications,
  IdRef,
  Questionnaire,
  Ref,
} from "@app/api/models";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { useFetchAssessmentsWithArchetypeApplications } from "@app/queries/assessments";
import { useFetchApplications } from "@app/queries/applications";
import { Donut } from "../donut/donut";
import { serializeFilterUrlParams } from "@app/hooks/table-controls";
import { Paths } from "@app/Paths";
import { Link } from "react-router-dom";

interface IAggregateRiskData {
  green: number;
  yellow: number;
  red: number;
  unknown: number;
  unassessed: number;
  applicationsCount: number;
}

const aggregateRiskData = (
  assessments: AssessmentWithArchetypeApplications[],
  applications: Application[],
  questionnaire: Questionnaire | null
): IAggregateRiskData => {
  let low = 0;
  let medium = 0;
  let high = 0;
  let unknown = 0;
  const processedAppIds = new Set(); // Set to track processed application IDs

  const findFullApplication = (ref: Ref) => {
    return applications.find((app) => app.id === ref.id);
  };

  assessments?.forEach((assessment) => {
    const combinedApplications = [
      ...(assessment.application ? [assessment.application] : []),
      ...(assessment.archetypeApplications ?? []),
    ];

    const uniqueApplications = combinedApplications.reduce(
      (acc: Ref[], current) => {
        if (!acc.find((item) => item?.id === current.id)) {
          acc.push(current);
        }
        return acc;
      },
      []
    );

    uniqueApplications.forEach((appRef) => {
      const fullApp = findFullApplication(appRef);
      if (fullApp && fullApp.risk && !processedAppIds.has(fullApp.id)) {
        processedAppIds.add(fullApp.id);
        let risk = fullApp.risk;
        if (questionnaire?.id === assessment.questionnaire.id) {
          risk = assessment.risk;
        }

        switch (risk) {
          case "green":
            low++;
            break;
          case "yellow":
            medium++;
            break;
          case "red":
            high++;
            break;
          case "unknown":
            unknown++;
            break;
        }
      }
    });
  });
  const unassessed = applications.length - processedAppIds.size;

  return {
    green: low,
    yellow: medium,
    red: high,
    unknown,
    unassessed,
    applicationsCount: applications.length,
  };
};

interface IApplicationLandscapeProps {
  /**
   * The selected questionnaire or `null` if _all questionnaires_ is selected.
   */
  questionnaire: Questionnaire | null;

  /**
   * The set of assessments for the selected questionnaire.  Risk values will be
   * aggregated from the individual assessment risks.
   */
  assessmentRefs?: IdRef[];
}

export const ApplicationLandscape: React.FC<IApplicationLandscapeProps> = ({
  questionnaire,
  assessmentRefs,
}) => {
  const { t } = useTranslation();

  const { assessmentsWithArchetypeApplications } =
    useFetchAssessmentsWithArchetypeApplications();
  const { data: applications } = useFetchApplications();

  const filteredAssessments = assessmentsWithArchetypeApplications.filter(
    (assessment) => assessmentRefs?.some((ref) => ref.id === assessment.id)
  );

  const landscapeData = useMemo(
    () => aggregateRiskData(filteredAssessments, applications, questionnaire),
    [filteredAssessments, applications, questionnaire]
  );

  return (
    <ConditionalRender
      when={!questionnaire && !filteredAssessments}
      then={
        <div style={{ height: 200, width: 400 }}>
          <Skeleton height="75%" width="100%" />
        </div>
      }
    >
      {landscapeData && (
        <Flex
          justifyContent={{ default: "justifyContentSpaceAround" }}
          spaceItems={{ default: "spaceItemsNone" }}
          gap={{ default: "gapMd" }}
        >
          <FlexItem>
            <Donut
              isAssessment={false}
              id="landscape-donut-red"
              value={landscapeData.red}
              total={landscapeData.applicationsCount}
              color={RISK_LIST.red.hexColor}
              riskLabel={
                <Link to={getRisksUrl(["red"])}>{t("terms.highRisk")}</Link>
              }
              riskTitle={t("terms.highRisk")}
              riskDescription={questionnaire?.riskMessages?.red ?? ""}
            />
          </FlexItem>
          <FlexItem>
            <Donut
              isAssessment={false}
              id="landscape-donut-yellow"
              value={landscapeData.yellow}
              total={landscapeData.applicationsCount}
              color={RISK_LIST.yellow.hexColor}
              riskLabel={
                <Link to={getRisksUrl(["yellow"])}>
                  {t("terms.mediumRisk")}
                </Link>
              }
              riskTitle={t("terms.mediumRisk")}
              riskDescription={questionnaire?.riskMessages?.yellow ?? ""}
            />
          </FlexItem>
          <FlexItem>
            <Donut
              isAssessment={false}
              id="landscape-donut-green"
              value={landscapeData.green}
              total={landscapeData.applicationsCount}
              color={RISK_LIST.green.hexColor}
              riskLabel={
                <Link to={getRisksUrl(["green"])}>{t("terms.lowRisk")}</Link>
              }
              riskTitle={t("terms.lowRisk")}
              riskDescription={questionnaire?.riskMessages?.green ?? ""}
            />
          </FlexItem>
          <FlexItem>
            <Donut
              isAssessment={false}
              id="landscape-donut-unassessed"
              value={landscapeData.unassessed + landscapeData.unknown}
              total={landscapeData.applicationsCount}
              color={RISK_LIST.unknown.hexColor}
              riskLabel={
                <Link to={getRisksUrl(["unknown"])}>
                  {`${t("terms.unassessed")}/${t("terms.unknown")}`}
                </Link>
              }
              riskTitle={t("terms.unassessedOrUnknown")}
            />
          </FlexItem>
        </Flex>
      )}
    </ConditionalRender>
  );
};

const getRisksUrl = (risks: string[]) => {
  const filterValues = {
    risk: risks,
  };

  const serializedParams = serializeFilterUrlParams(filterValues);

  const queryString = serializedParams.filters
    ? `filters=${serializedParams.filters}`
    : "";
  return `${Paths.applications}?${queryString}`;
};
