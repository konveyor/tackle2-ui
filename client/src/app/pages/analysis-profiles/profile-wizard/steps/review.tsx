import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Label,
  LabelGroup,
  List,
  ListItem,
  Text,
  TextContent,
  Title,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { GroupOfLabels } from "@app/components/analysis/components/group-of-labels";
import { CustomRulesStepState } from "@app/components/analysis/steps/custom-rules";
import { parseAndGroupLabels, parseLabel } from "@app/utils/rules-utils";

import { WizardState } from "../useWizardReducer";

interface ReviewProps {
  state: WizardState;
}

const defaultMode: Map<string, string> = new Map([
  ["binary", "Binary"],
  ["source-code", "Source code"],
  ["source-code-deps", "Source code + dependencies"],
  ["binary-upload", "Upload a local binary"],
]);

const defaultScopes: Map<string, string> = new Map([
  ["app", "Application and internal dependencies"],
  ["oss", "Known Open Source libraries"],
  ["select", "List of packages to be analyzed manually"],
]);

export const Review: React.FC<ReviewProps> = ({
  state: { profileDetails, mode, targets, scope, customRules, labels },
}) => {
  const { t } = useTranslation();

  const hasIncludedPackages = scope.withKnownLibs.includes("select");
  const targetParsedLabels = targets.selectedTargets.map(([target, label]) => ({
    target,
    labels: parseAndGroupLabels(label ? [label] : (target.labels ?? [])),
  }));

  return (
    <>
      <TextContent>
        <Title headingLevel="h3" size="xl">
          {t("analysisProfileWizard.steps.review.title")}
        </Title>
        <Text>{t("analysisProfileWizard.steps.review.description")}</Text>
      </TextContent>

      <DescriptionList isHorizontal className={spacing.mtMd}>
        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.name")}</DescriptionListTerm>
          <DescriptionListDescription id="name">
            {profileDetails.name}
          </DescriptionListDescription>
        </DescriptionListGroup>

        {profileDetails.description && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.description")}</DescriptionListTerm>
            <DescriptionListDescription id="description">
              {profileDetails.description}
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}

        {/* Mode */}
        <DescriptionListGroup>
          <DescriptionListTerm>{t("wizard.terms.mode")}</DescriptionListTerm>
          <DescriptionListDescription id="mode">
            {defaultMode.get(mode.mode)}
          </DescriptionListDescription>
        </DescriptionListGroup>

        {/* Targets */}
        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("analysisSteps.review.targets", {
              count: targets.selectedTargets.length,
            })}
          </DescriptionListTerm>
          <DescriptionListDescription id="targets">
            <List isPlain>
              {targets.selectedTargets.map(([target, label]) => (
                <ListItem key={target.id}>
                  {target.name}
                  {target.choice && label && ` (${label.name})`}
                </ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Target rule labels</DescriptionListTerm>
          <DescriptionListDescription id="target-target-labels">
            <Flex direction={{ default: "row" }}>
              {targetParsedLabels
                .filter(({ labels }) => labels.target.length > 0)
                .map(({ target, labels }) => (
                  <FlexItem key={target.id}>
                    <GroupOfLabels
                      groupName={target.name}
                      items={labels.target}
                    />
                  </FlexItem>
                ))}
              {customRules.customLabels.length > 0 && (
                <FlexItem key="custom-target-labels">
                  <GroupOfLabels
                    groupName="Manual custom rules"
                    items={parseAndGroupLabels(customRules.customLabels).target}
                  />
                </FlexItem>
              )}
            </Flex>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Source rule labels</DescriptionListTerm>
          <DescriptionListDescription id="target-source-labels">
            <Flex direction={{ default: "row" }}>
              {targetParsedLabels
                .filter(({ labels }) => labels.source.length > 0)
                .map(({ target, labels }) => (
                  <FlexItem key={target.id}>
                    <GroupOfLabels
                      groupName={target.name}
                      items={labels.source}
                    />
                  </FlexItem>
                ))}
              {customRules.customLabels.length > 0 && (
                <FlexItem key="custom-source-labels">
                  <GroupOfLabels
                    groupName="Manual custom rules"
                    items={parseAndGroupLabels(customRules.customLabels).source}
                  />
                </FlexItem>
              )}
            </Flex>
          </DescriptionListDescription>
        </DescriptionListGroup>

        {/* Scope */}
        <DescriptionListGroup>
          <DescriptionListTerm>{t("wizard.terms.scope")}</DescriptionListTerm>
          <DescriptionListDescription id="scope">
            <List isPlain>
              {scope.withKnownLibs.split(",").map((scopePart, index) => (
                <ListItem key={index}>{defaultScopes.get(scopePart)}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("wizard.composed.included", {
              what: t("wizard.terms.packages").toLowerCase(),
            })}
          </DescriptionListTerm>
          <DescriptionListDescription id="included-packages">
            <List isPlain>
              {hasIncludedPackages
                ? scope.includedPackages.map((pkg, index) => (
                    <ListItem key={index}>{pkg}</ListItem>
                  ))
                : null}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("wizard.composed.excluded", {
              what: t("wizard.terms.packages").toLowerCase(),
            })}
          </DescriptionListTerm>
          <DescriptionListDescription id="excluded-packages">
            <List isPlain>
              {scope.hasExcludedPackages
                ? scope.excludedPackages.map((pkg, index) => (
                    <ListItem key={index}>{pkg}</ListItem>
                  ))
                : null}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>

        {/* Custom rules */}
        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("wizard.terms.customRules")}
          </DescriptionListTerm>
          <DescriptionListDescription id="rules">
            <ReviewCustomRules customRules={customRules} />
          </DescriptionListDescription>
        </DescriptionListGroup>

        {/* Advanced options */}
        <DescriptionListGroup>
          <DescriptionListTerm>Additional target labels</DescriptionListTerm>
          <DescriptionListDescription id="additional-target-labels">
            <GroupOfLabels
              items={labels.additionalTargetLabels.map(parseLabel)}
            />
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Additional source labels</DescriptionListTerm>
          <DescriptionListDescription id="additional-source-labels">
            <GroupOfLabels
              items={labels.additionalSourceLabels.map(parseLabel)}
            />
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("wizard.composed.excluded", {
              what: t("wizard.terms.rulesTags").toLowerCase(),
            })}
          </DescriptionListTerm>
          <DescriptionListDescription id="excluded-rules-labels">
            <LabelGroup numLabels={5}>
              {labels.excludedLabels.map((tag) => (
                <Label key={tag}>{tag}</Label>
              ))}
            </LabelGroup>
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </>
  );
};

const ReviewCustomRules: React.FC<{ customRules: CustomRulesStepState }> = ({
  customRules,
}) => {
  if (customRules.rulesKind === "manual") {
    return (
      <List isPlain>
        {customRules.customRulesFiles.map((rule, index) => (
          <ListItem key={index}>{rule.fileName}</ListItem>
        ))}
      </List>
    );
  }
  return (
    <DescriptionList isHorizontal>
      <DescriptionListGroup>
        <DescriptionListTerm>Source repository</DescriptionListTerm>
        <DescriptionListDescription id="source-repository">
          {customRules.sourceRepository}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Branch</DescriptionListTerm>
        <DescriptionListDescription id="branch">
          {customRules.branch}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Root path</DescriptionListTerm>
        <DescriptionListDescription id="root-path">
          {customRules.rootPath}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Associated credentials</DescriptionListTerm>
        <DescriptionListDescription id="associated-credentials">
          {customRules.associatedCredentials}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};
