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

import { AnalysisProfile, Application } from "@app/api/models";
import { parseAndGroupLabels, parseLabel } from "@app/utils/rules-utils";

import { GroupOfLabels } from "../components/group-of-labels";
import {
  AdvancedOptionsValues,
  AnalysisMode,
  AnalysisScopeValues,
  CustomRulesStepValues,
  SetTargetsValues,
  WizardFlowMode,
} from "../schema";

interface ReviewProps {
  applications: Application[];
  flowMode: WizardFlowMode;
  selectedProfile: AnalysisProfile | null;
  mode: AnalysisMode;
  targets: SetTargetsValues;
  scope: AnalysisScopeValues;
  customRules: CustomRulesStepValues;
  options: AdvancedOptionsValues;
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
  applications,
  flowMode,
  selectedProfile,
  mode,
  targets,
  scope,
  customRules,
  options,
}) => {
  const { t } = useTranslation();

  // Profile mode review
  if (flowMode === "profile") {
    return (
      <ReviewProfile
        applications={applications}
        selectedProfile={selectedProfile}
        options={options}
      />
    );
  }

  // Manual mode review
  return (
    <ReviewManual
      applications={applications}
      mode={mode}
      targets={targets}
      scope={scope}
      customRules={customRules}
      options={options}
    />
  );
};

interface ReviewProfileProps {
  applications: Application[];
  selectedProfile: AnalysisProfile | null;
  options: AdvancedOptionsValues;
}

const ReviewProfile: React.FC<ReviewProfileProps> = ({
  applications,
  selectedProfile,
  options,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <TextContent>
        <Title headingLevel="h3" size="xl">
          {t("analysisWizard.review.title")}
        </Title>
        <Text>{t("analysisWizard.review.profileDescription")}</Text>
      </TextContent>

      <DescriptionList isHorizontal className={spacing.mtMd}>
        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.applications")}</DescriptionListTerm>
          <DescriptionListDescription id="applications">
            <List isPlain>
              {applications.map((app) => (
                <ListItem key={app.id}>{app.name}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("wizard.label.analysisProfile")}
          </DescriptionListTerm>
          <DescriptionListDescription id="analysis-profile">
            {selectedProfile?.name ?? t("analysisProfiles.none")}
          </DescriptionListDescription>
        </DescriptionListGroup>

        {selectedProfile?.description && (
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.description")}</DescriptionListTerm>
            <DescriptionListDescription id="profile-description">
              {selectedProfile.description}
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}

        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("wizard.terms.autoTagging")}
          </DescriptionListTerm>
          <DescriptionListDescription id="autoTagging">
            {options.autoTaggingEnabled
              ? t("wizard.terms.enabled")
              : t("wizard.terms.disabled")}
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("wizard.terms.advancedAnalysisDetails")}
          </DescriptionListTerm>
          <DescriptionListDescription id="advanced-analysis-details">
            {options.advancedAnalysisEnabled
              ? t("wizard.terms.enabled")
              : t("wizard.terms.disabled")}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </>
  );
};

interface ReviewManualProps {
  applications: Application[];
  mode: AnalysisMode;
  targets: SetTargetsValues;
  scope: AnalysisScopeValues;
  customRules: CustomRulesStepValues;
  options: AdvancedOptionsValues;
}

const ReviewManual: React.FC<ReviewManualProps> = ({
  applications,
  mode,
  targets,
  scope,
  customRules,
  options,
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
          {t("analysisWizard.review.title")}
        </Title>
        <Text>{t("analysisWizard.review.description")}</Text>
      </TextContent>

      <DescriptionList isHorizontal className={spacing.mtMd}>
        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.applications")}</DescriptionListTerm>
          <DescriptionListDescription id="applications">
            <List isPlain>
              {applications.map((app) => (
                <ListItem key={app.id}>{app.name}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>

        {/* Mode */}
        <DescriptionListGroup>
          <DescriptionListTerm>{t("wizard.terms.mode")}</DescriptionListTerm>
          <DescriptionListDescription id="mode">
            {defaultMode.get(mode)}
          </DescriptionListDescription>
        </DescriptionListGroup>

        {/* Targets */}
        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("analysisWizard.review.targets", {
              count: targets.selectedTargets.length,
            })}
          </DescriptionListTerm>
          <DescriptionListDescription id="targets">
            <List isPlain>
              {targetParsedLabels.map(({ target }) => (
                <ListItem key={target.id}>{target.name}</ListItem>
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
              items={options.additionalTargetLabels.map(parseLabel)}
            />
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Additional source labels</DescriptionListTerm>
          <DescriptionListDescription id="additional-source-labels">
            <GroupOfLabels
              items={options.additionalSourceLabels.map(parseLabel)}
            />
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("wizard.composed.excluded", {
              what: t("wizard.terms.rulesTags").toLowerCase(),
            })}
          </DescriptionListTerm>
          <DescriptionListDescription id="excluded-rules-tags">
            <LabelGroup numLabels={5}>
              {options.excludedLabels.map((tag) => (
                <Label key={tag}>{tag}</Label>
              ))}
            </LabelGroup>
          </DescriptionListDescription>
        </DescriptionListGroup>

        {options.saveAsProfile && (
          <DescriptionListGroup>
            <DescriptionListTerm>
              {t("wizard.label.saveAsProfileReview")}
            </DescriptionListTerm>
            <DescriptionListDescription id="analysis-profile-name">
              {options.profileName}
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}

        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("wizard.terms.autoTagging")}
          </DescriptionListTerm>
          <DescriptionListDescription id="autoTagging">
            {options.autoTaggingEnabled
              ? t("wizard.terms.enabled")
              : t("wizard.terms.disabled")}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("wizard.terms.advancedAnalysisDetails")}
          </DescriptionListTerm>
          <DescriptionListDescription id="advanced-analysis-details">
            {options.advancedAnalysisEnabled
              ? t("wizard.terms.enabled")
              : t("wizard.terms.disabled")}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </>
  );
};

const ReviewCustomRules: React.FC<{ customRules: CustomRulesStepValues }> = ({
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
