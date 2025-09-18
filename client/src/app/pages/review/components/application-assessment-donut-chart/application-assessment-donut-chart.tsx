import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChartDonut, ChartLegend } from "@patternfly/react-charts";
import { global_palette_blue_300 as defaultColor } from "@patternfly/react-tokens";

import { RISK_LIST } from "@app/Constants";
import { Assessment, Section } from "@app/api/models";

export interface ChartData {
  red: number;
  amber: number;
  green: number;
  unknown: number;
}

export const getChartDataFromCategories = (sections: Section[]): ChartData => {
  let green = 0;
  let amber = 0;
  let red = 0;
  let unknown = 0;

  sections
    .flatMap((f) => f.questions)
    .flatMap((f) => f.answers)
    .filter((f) => f.selected === true)
    .forEach((f) => {
      switch (f.risk) {
        case "green":
          green++;
          break;
        case "yellow":
          amber++;
          break;
        case "red":
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
    return getChartDataFromCategories(assessment.sections || []);
  }, [assessment]);

  const chartDefinition = [
    {
      x: t(RISK_LIST["green"].i18Key),
      y: charData.green,
      color: RISK_LIST["green"].hexColor,
    },
    {
      x: t(RISK_LIST["yellow"].i18Key),
      y: charData.amber,
      color: RISK_LIST["yellow"].hexColor,
    },
    {
      x: t(RISK_LIST["red"].i18Key),
      y: charData.red,
      color: RISK_LIST["red"].hexColor,
    },
    {
      x: t(RISK_LIST["unknown"].i18Key),
      y: charData.unknown,
      color: RISK_LIST["unknown"].hexColor,
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
