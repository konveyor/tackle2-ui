import React from "react";
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
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Application } from "@app/api/models";
import { IAnalysisWizardFormValues } from "./analysis-wizard";

interface IReview {
  applications: Application[];
  mode: string;
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

export const Review: React.FunctionComponent<IReview> = ({
  applications,
  mode,
}) => {
  const { t } = useTranslation();

  const { getValues } = useFormContext<IAnalysisWizardFormValues>();
  const {
    targets,
    sources,
    withKnown,
    includedPackages,
    excludedPackages,
    customRulesFiles,
    excludedRulesTags,
  } = getValues();

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
            {targets.length > 1
              ? t("wizard.terms.targets")
              : t("wizard.terms.target")}
          </DescriptionListTerm>
          <DescriptionListDescription id="targets">
            <List isPlain>
              {targets.map((target, index) => (
                <ListItem key={index}>{target}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {targets.length > 1
              ? t("wizard.terms.sources")
              : t("wizard.terms.source")}
          </DescriptionListTerm>
          <DescriptionListDescription id="sources">
            <List isPlain>
              {sources.map((source, index) => (
                <ListItem key={index}>{source}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t("wizard.terms.scope")}</DescriptionListTerm>
          <DescriptionListDescription id="scope">
            <List isPlain>
              {withKnown.split(",").map((scope, index) => (
                <ListItem key={index}>{defaultScopes.get(scope)}</ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {
              // t("wizard.terms.packages")
              t("wizard.composed.included", {
                what: t("wizard.terms.packages").toLowerCase(),
              })
            }
          </DescriptionListTerm>
          <DescriptionListDescription id="included-packages">
            <List isPlain>
              {includedPackages.map((pkg, index) => (
                <ListItem key={index}>{pkg}</ListItem>
              ))}
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
              {excludedPackages.map((pkg, index) => (
                <ListItem key={index}>{pkg}</ListItem>
              ))}
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
      </DescriptionList>
    </>
  );
};
