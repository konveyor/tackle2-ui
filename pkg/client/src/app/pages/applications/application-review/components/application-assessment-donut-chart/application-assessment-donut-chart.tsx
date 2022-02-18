import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChartDonut, ChartLegend } from "@patternfly/react-charts";

import { global_palette_blue_300 as defaultColor } from "@patternfly/react-tokens";

import { RISK_LIST } from "@app/Constants";
import { Assessment, QuestionnaireCategory } from "@app/api/models";

export interface ChartData {
  red: number;
  amber: number;
  green: number;
  unknown: number;
}

export const getChartDataFromCategories = (
  categories: QuestionnaireCategory[]
): ChartData => {
  let green = 0;
  let amber = 0;
  let red = 0;
  let unknown = 0;

  categories
    .flatMap((f) => f.questions)
    .flatMap((f) => f.options)
    .filter((f) => f.checked === true)
    .forEach((f) => {
      switch (f.risk) {
        case "GREEN":
          green++;
          break;
        case "AMBER":
          amber++;
          break;
        case "RED":
          red++;
          break;
        default:
          unknown++;
      }
    });

  return {
    red,
    amber,
    green,
    unknown,
  } as ChartData;
};

export interface IApplicationAssessmentDonutChartProps {
  assessment: Assessment;
}

export const ApplicationAssessmentDonutChart: React.FC<
  IApplicationAssessmentDonutChartProps
> = ({ assessment }) => {
  const { t } = useTranslation();

  const charData: ChartData = useMemo(() => {
    return getChartDataFromCategories(assessment.questionnaire.categories);
  }, [assessment]);

  const chartDefinition = [
    {
      x: t(RISK_LIST["GREEN"].i18Key),
      y: charData.green,
      color: RISK_LIST["GREEN"].hexColor,
    },
    {
      x: t(RISK_LIST["AMBER"].i18Key),
      y: charData.amber,
      color: RISK_LIST["AMBER"].hexColor,
    },
    {
      x: t(RISK_LIST["RED"].i18Key),
      y: charData.red,
      color: RISK_LIST["RED"].hexColor,
    },
    {
      x: t(RISK_LIST["UNKNOWN"].i18Key),
      y: charData.unknown,
      color: RISK_LIST["UNKNOWN"].hexColor,
    },
  ].filter((f) => f.y > 0);

  return (
    <div style={{ height: "250px", width: "380px" }}>
      <ChartDonut
        ariaDesc="risk-donut-chart"
        constrainToVisibleArea={true}
        data={chartDefinition.map((elem) => ({ x: elem.x, y: elem.y }))}
        labels={({ datum }) => `${datum.x}: ${datum.y}`}
        colorScale={chartDefinition.map(
          (elem) => elem.color || defaultColor.value
        )}
        legendComponent={
          <ChartLegend
            data={chartDefinition.map((elem) => ({
              name: `${elem.x}: ${elem.y}`,
            }))}
            colorScale={chartDefinition.map(
              (elem) => elem.color || defaultColor.value
            )}
          />
        }
        legendOrientation="vertical"
        legendPosition="right"
        padding={{
          bottom: 20,
          left: 20,
          right: 140, // Adjusted to accommodate legend
          top: 20,
        }}
        innerRadius={50}
        width={380}
      />
    </div>
  );
};
