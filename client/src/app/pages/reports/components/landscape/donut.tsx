import React from "react";
import { useTranslation } from "react-i18next";

import { ChartDonut } from "@patternfly/react-charts";
import { global_palette_black_300 as black } from "@patternfly/react-tokens";

import { Stack, StackItem, Text, TextContent } from "@patternfly/react-core";

export interface IDonutProps {
  value: number;
  total: number;
  color: string;
  riskLabel: string;
  riskDescription: string;
}

export const Donut: React.FC<IDonutProps> = ({
  value,
  total,
  color,
  riskLabel,
  riskDescription,
}) => {
  const { t } = useTranslation();

  return (
    <Stack>
      <StackItem>
        <div style={{ height: "200px", width: "200px" }}>
          <ChartDonut
            ariaDesc="risk-donut-chart"
            title={value.toString()}
            subTitle={t("composed.ofTotalApplications", {
              count: total,
            }).toLocaleLowerCase()}
            constrainToVisibleArea={true}
            data={[
              { x: riskLabel, y: value },
              { x: t("terms.other"), y: total - value },
            ]}
            labels={({ datum }) => `${datum.x}: ${datum.y}`}
            colorScale={[color, black.value]}
          />
        </div>
      </StackItem>
      <StackItem>
        <TextContent className="pf-u-text-align-center">
          <Text component="h3">{riskLabel}</Text>
          <Text component="small">{riskDescription}</Text>
        </TextContent>
      </StackItem>
    </Stack>
  );
};
