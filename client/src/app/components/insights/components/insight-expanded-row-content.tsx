import * as React from "react";
import {
  Flex,
  FlexItem,
  Label,
  LabelGroup,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import textStyles from "@patternfly/react-styles/css/utilities/Text/text";
import { ExpandableRowContent } from "@patternfly/react-table";

import {
  UiAnalysisReportApplicationInsight,
  UiAnalysisReportInsight,
} from "@app/api/models";

import { InsightDescriptionAndLinks } from "../components";
import { parseReportLabels } from "../helpers";

export const ExpandedFieldHeading: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <h4
      className={`${spacing.mtSm} ${spacing.mbSm} ${textStyles.fontSizeSm} ${textStyles.fontWeightBold}`}
    >
      {children}
    </h4>
  );
};

export const InsightExpandedRowContent: React.FC<{
  insight: UiAnalysisReportInsight | UiAnalysisReportApplicationInsight;
  totalAffectedLabel: string;
  totalAffected: React.ReactNode;
}> = ({ insight, totalAffectedLabel, totalAffected }) => {
  const { sources, targets, otherLabels } = parseReportLabels(insight);

  return (
    <ExpandableRowContent>
      <Flex>
        <FlexItem flex={{ default: "flex_1" }}>
          <ExpandedFieldHeading>{totalAffectedLabel}</ExpandedFieldHeading>
          {totalAffected}

          <ExpandedFieldHeading>Target technologies</ExpandedFieldHeading>
          <div>
            {targets.length > 0 ? (
              <LabelGroup>
                {targets.map((target) => (
                  <Label key={target}>{target}</Label>
                ))}
              </LabelGroup>
            ) : (
              "None"
            )}
          </div>

          <ExpandedFieldHeading>Source technologies</ExpandedFieldHeading>
          <div>
            {sources.length > 0 ? (
              <LabelGroup>
                {sources.map((source) => (
                  <Label key={source}>{source}</Label>
                ))}
              </LabelGroup>
            ) : (
              "None"
            )}
          </div>

          <ExpandedFieldHeading>Rule set</ExpandedFieldHeading>
          <div>{insight.ruleset}</div>

          <ExpandedFieldHeading>Rule</ExpandedFieldHeading>
          <div>{insight.rule}</div>

          <ExpandedFieldHeading>Labels</ExpandedFieldHeading>
          <div>
            {otherLabels.length > 0 ? (
              <LabelGroup>
                {otherLabels.map((label) => (
                  <Label key={label}>{label}</Label>
                ))}
              </LabelGroup>
            ) : (
              "None"
            )}
          </div>
        </FlexItem>
        <FlexItem flex={{ default: "flex_1" }}>
          <InsightDescriptionAndLinks
            className={spacing.mrLg}
            description={insight.description}
            links={insight.links}
          />
        </FlexItem>
      </Flex>
    </ExpandableRowContent>
  );
};
