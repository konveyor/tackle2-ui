import * as React from "react";
import { useTranslation } from "react-i18next";
import { ChartDonut } from "@patternfly/react-charts/victory";
import {
  Bullseye,
  Stack,
  StackItem,
  Content,
  Content,
  ContentVariants,
} from "@patternfly/react-core";
import {
  t_temp_dev_tbd as black /* CODEMODS: you should update this color token, original v5 token was global_palette_black_300 */,
} from "@patternfly/react-tokens";

export interface IDonutProps {
  id: string;
  value: number;
  total: number;
  color: string;
  riskLabel: string | React.ReactElement;
  riskDescription?: string;
  riskTitle: string;
  isAssessment: boolean;
}

export const Donut: React.FC<IDonutProps> = ({
  id,
  value,
  total,
  color,
  riskLabel,
  isAssessment,
  riskTitle,
  riskDescription,
}) => {
  const { t } = useTranslation();

  return (
    <Stack id={id} style={{ width: "200px" }}>
      <StackItem style={{ height: "200px", width: "100%" }}>
        <Bullseye>
          <ChartDonut
            ariaDesc="risk-donut-chart"
            title={value.toString()}
            subTitle={
              isAssessment
                ? t("composed.ofTotalAssessments", {
                    count: total,
                  }).toLocaleLowerCase()
                : t("composed.ofTotalApplications", {
                    count: total,
                  }).toLocaleLowerCase()
            }
            constrainToVisibleArea={true}
            data={[
              { x: riskTitle, y: value },
              { x: t("terms.other"), y: total - value },
            ]}
            labels={({ datum }) => `${datum.x}: ${datum.y}`}
            colorScale={[color, black.value]}
          />
        </Bullseye>
      </StackItem>
      <StackItem style={{ width: "100%" }}>
        <Content className="pf-v5-u-text-align-center">
          <Content component="h3">{riskLabel}</Content>
          <Content
            component={ContentVariants.small}
            className="pf-v5-u-color-200 pf-v5-u-font-weight-light"
          >
            {riskDescription}
          </Content>
        </Content>
      </StackItem>
    </Stack>
  );
};
