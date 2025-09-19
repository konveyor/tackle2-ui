import React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  List,
  ListItem,
  Text,
  TextContent,
  Title,
} from "@patternfly/react-core";

import { Application } from "@app/api/models";
import { getParsedLabel } from "@app/utils/rules-utils";

import { AnalysisWizardFormValues } from "./schema";

interface IReview {
  applications: Application[];
  mode: string;
}

// TODO translations for strings in defaultMode and defaultScopes

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

export const Review: React.FC<IReview> = ({ applications, mode }) => {
  const { t } = useTranslation();

  const { watch } = useFormContext<AnalysisWizardFormValues>();
  const {
    selectedTargetLabels,
    selectedSourceLabels,
    withKnownLibs,
    includedPackages,
    hasExcludedPackages,
    excludedPackages,
    customRulesFiles,
    excludedRulesTags,
    autoTaggingEnabled,
    advancedAnalysisEnabled,
  } = watch();

  const hasIncludedPackages = withKnownLibs.includes("select");

  return (
    <>
      <TextContent>
        <Title headingLevel="h3" size="xl">
          {t("wizard.title.review")}
        </Title>
        <Text>{t("wizard.label.reviewDetails")}</Text>
      </TextContent>
      <DescriptionList isHorizontal>
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
          <DescriptionListTerm>{t("wizard.terms.mode")}</DescriptionListTerm>
          <DescriptionListDescription id="mode">
            {defaultMode.get(mode)}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("wizard.terms.target", { count: selectedTargetLabels.length })}
          </DescriptionListTerm>
          <DescriptionListDescription id="targets">
            <List isPlain>
              {selectedTargetLabels.map((label, index) => {
                const parsedLabel = getParsedLabel(label?.label);
                if (parsedLabel.labelType === "target") {
                  return (
                    <ListItem key={index}>{parsedLabel.labelValue}</ListItem>
                  );
                }
              })}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("wizard.terms.source", { count: selectedSourceLabels.length })}
          </DescriptionListTerm>
          <DescriptionListDescription id="sources">
            <List isPlain>
              {selectedSourceLabels.map((label, index) => {
                const parsedLabel = getParsedLabel(label?.label);
                if (parsedLabel.labelType === "source") {
                  return (
                    <ListItem key={index}>{parsedLabel.labelValue}</ListItem>
                  );
                }
              })}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t("wizard.terms.scope")}</DescriptionListTerm>
          <DescriptionListDescription id="scope">
            <List isPlain>
              {withKnownLibs.split(",").map((scope, index) => (
                <ListItem key={index}>{defaultScopes.get(scope)}</ListItem>
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
                ? includedPackages.map((pkg, index) => (
                    <ListItem key={index}>{pkg}</ListItem>
                  ))
                : null}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {
              // t("wizard.terms.packages")
              t("wizard.composed.excluded", {
                what: t("wizard.terms.packages").toLowerCase(),
              })
            }
          </DescriptionListTerm>
          <DescriptionListDescription id="excluded-packages">
            <List isPlain>
              {hasExcludedPackages
                ? excludedPackages.map((pkg, index) => (
                    <ListItem key={index}>{pkg}</ListItem>
                  ))
                : null}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("wizard.terms.customRules")}
          </DescriptionListTerm>
          <DescriptionListDescription id="rules">
            <List isPlain>
              {customRulesFiles.map((rule, index) => (
                <ListItem key={index}>{rule.fileName}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {
              // t("wizard.terms.rulesTags")
              t("wizard.composed.excluded", {
                what: t("wizard.terms.rulesTags").toLowerCase(),
              })
            }
          </DescriptionListTerm>
          <DescriptionListDescription id="excluded-rules-tags">
            <List isPlain>
              {excludedRulesTags.map((tag, index) => (
                <ListItem key={index}>{tag}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("wizard.terms.autoTagging")}
          </DescriptionListTerm>
          <DescriptionListDescription id="autoTagging">
            {autoTaggingEnabled
              ? t("wizard.terms.enabled")
              : t("wizard.terms.disabled")}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("wizard.terms.advancedAnalysisDetails")}
          </DescriptionListTerm>
          <DescriptionListDescription id="advanced-analysis-details">
            {advancedAnalysisEnabled
              ? t("wizard.terms.enabled")
              : t("wizard.terms.disabled")}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </>
  );
};
