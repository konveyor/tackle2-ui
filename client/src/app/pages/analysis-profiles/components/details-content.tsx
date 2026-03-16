import * as React from "react";
import { TFunction } from "i18next";
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
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { GroupOfLabels } from "@app/components/analysis/components/group-of-labels";
import { CustomRulesStepState } from "@app/components/analysis/steps/custom-rules";
import { parseAndGroupLabels, parseLabel } from "@app/utils/rules-utils";

import { WizardState } from "../profile-wizard/useWizardReducer";

import { StringLabels } from "./string-labels";

export interface DetailsContentProps {
  state: WizardState;
  overflowLabelCount?: number;
  hideName?: boolean;
}

const createDefaultMode: (t: TFunction) => Map<string, string> = (t) =>
  new Map([
    ["binary", t("wizard.sourceMode.binary")],
    ["source-code", t("wizard.sourceMode.sourceCode")],
    ["source-code-deps", t("wizard.sourceMode.sourceCodeDeps")],
    ["binary-upload", t("wizard.sourceMode.binaryUpload")],
  ]);

const createDefaultScopes: (t: TFunction) => Map<string, string> = (t) =>
  new Map([
    ["app", t("wizard.label.scopeInternalDepsShort")],
    ["oss", t("wizard.label.scopeAllDepsShort")],
    ["select", t("wizard.label.scopeSelectDepsShort")],
  ]);

export const DetailsContent: React.FC<DetailsContentProps> = ({
  state: { profileDetails, mode, targets, scope, customRules, labels },
  overflowLabelCount,
  hideName,
}) => {
  const { t } = useTranslation();
  const defaultScopes = createDefaultScopes(t);
  const defaultMode = createDefaultMode(t);

  const parsedLabels = targets.selectedTargets.map(([target, label]) => ({
    target,
    labels: parseAndGroupLabels(label ? [label] : (target.labels ?? [])),
  }));

  const targetLabels = parsedLabels.filter(
    ({ labels }) => labels.target.length > 0
  );
  const sourceLabels = parsedLabels.filter(
    ({ labels }) => labels.source.length > 0
  );
  const customLabels = parseAndGroupLabels(customRules.customLabels);

  const scopeParts =
    scope.withKnownLibs
      ?.split(",")
      .map((scopePart) => defaultScopes.get(scopePart) ?? scopePart) ?? [];

  return (
    <DescriptionList isHorizontal className={spacing.mtMd}>
      {!hideName && (
        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.name")}</DescriptionListTerm>
          <DescriptionListDescription id="name">
            {profileDetails.name}
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
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
          {defaultMode.get(mode.mode) || <EmptyTextMessage />}
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
          <StringLabels
            overflowLabelCount={overflowLabelCount}
            color="blue"
            items={targets.selectedTargets?.map(
              ([target, label]) =>
                `${target.name}${target.choice && label ? ` (${label.name})` : ""}`
            )}
          />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>
          {t("analysisSteps.review.targetRuleLabels")}
        </DescriptionListTerm>
        <DescriptionListDescription id="target-target-labels">
          {targetLabels.length > 0 || customLabels.target.length > 0 ? (
            <Flex direction={{ default: "row" }}>
              {targetLabels.map(({ target, labels }) => (
                <FlexItem key={target.id}>
                  <GroupOfLabels
                    groupName={target.name}
                    items={labels.target}
                  />
                </FlexItem>
              ))}
              {customLabels.target.length > 0 && (
                <FlexItem key="custom-target-labels">
                  <GroupOfLabels
                    groupName={t("analysisSteps.review.manualCustomRules")}
                    items={customLabels.target}
                  />
                </FlexItem>
              )}
            </Flex>
          ) : (
            <EmptyTextMessage message={t("terms.none")} />
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>
          {t("analysisSteps.review.sourceRuleLabels")}
        </DescriptionListTerm>
        <DescriptionListDescription id="target-source-labels">
          {sourceLabels.length > 0 || customLabels.source.length > 0 ? (
            <Flex direction={{ default: "row" }}>
              {sourceLabels.map(({ target, labels }) => (
                <FlexItem key={target.id}>
                  <GroupOfLabels
                    groupName={target.name}
                    items={labels.source}
                  />
                </FlexItem>
              ))}
              {customLabels.source.length > 0 && (
                <FlexItem key="custom-source-labels">
                  <GroupOfLabels
                    groupName={t("analysisSteps.review.manualCustomRules")}
                    items={customLabels.source}
                  />
                </FlexItem>
              )}
            </Flex>
          ) : (
            <EmptyTextMessage message={t("terms.none")} />
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>

      {/* Scope */}
      <DescriptionListGroup>
        <DescriptionListTerm>{t("wizard.terms.scope")}</DescriptionListTerm>
        <DescriptionListDescription id="scope">
          {scopeParts.length > 0 ? (
            <List isPlain>
              {scopeParts.map((scopePart, index) => (
                <ListItem key={index}>{scopePart}</ListItem>
              ))}
            </List>
          ) : (
            <EmptyTextMessage message={t("terms.none")} />
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>
          {t("wizard.composed.included", {
            what: t("wizard.terms.packages").toLowerCase(),
          })}
        </DescriptionListTerm>
        <DescriptionListDescription id="included-packages">
          {scope.includedPackages?.length > 0 ? (
            <List isPlain>
              {scope.includedPackages.map((pkg, index) => (
                <ListItem key={index}>{pkg}</ListItem>
              ))}
            </List>
          ) : (
            <EmptyTextMessage message={t("terms.none")} />
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>
          {t("wizard.composed.excluded", {
            what: t("wizard.terms.packages").toLowerCase(),
          })}
        </DescriptionListTerm>
        <DescriptionListDescription id="excluded-packages">
          {scope.excludedPackages?.length > 0 ? (
            <List isPlain>
              {scope.excludedPackages.map((pkg, index) => (
                <ListItem key={index}>{pkg}</ListItem>
              ))}
            </List>
          ) : (
            <EmptyTextMessage message={t("terms.none")} />
          )}
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
        <DescriptionListTerm>
          {t("analysisSteps.review.additionalTargetLabels")}
        </DescriptionListTerm>
        <DescriptionListDescription id="additional-target-labels">
          {labels.additionalTargetLabels.length > 0 ? (
            <GroupOfLabels
              items={labels.additionalTargetLabels.map(parseLabel)}
            />
          ) : (
            <EmptyTextMessage message={t("terms.none")} />
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>
          {t("analysisSteps.review.additionalSourceLabels")}
        </DescriptionListTerm>
        <DescriptionListDescription id="additional-source-labels">
          {labels.additionalSourceLabels.length > 0 ? (
            <GroupOfLabels
              items={labels.additionalSourceLabels.map(parseLabel)}
            />
          ) : (
            <EmptyTextMessage message={t("terms.none")} />
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>
          {t("wizard.composed.excluded", {
            what: t("wizard.terms.rulesTags").toLowerCase(),
          })}
        </DescriptionListTerm>
        <DescriptionListDescription id="excluded-rules-labels">
          {labels.excludedLabels.length > 0 ? (
            <LabelGroup numLabels={5}>
              {labels.excludedLabels.map((tag) => (
                <Label key={tag}>{tag}</Label>
              ))}
            </LabelGroup>
          ) : (
            <EmptyTextMessage message={t("terms.none")} />
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

const ReviewCustomRules: React.FC<{ customRules: CustomRulesStepState }> = ({
  customRules,
}) => {
  const { t } = useTranslation();
  if (customRules.rulesKind === "manual") {
    return (
      <StringLabels
        items={customRules.customRulesFiles?.map((rule) => rule.fileName)}
      />
    );
  }
  return (
    <DescriptionList isHorizontal>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.sourceRepo")}</DescriptionListTerm>
        <DescriptionListDescription id="source-repository">
          {customRules.sourceRepository || <EmptyTextMessage />}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.branch")}</DescriptionListTerm>
        <DescriptionListDescription id="branch">
          {customRules.branch || <EmptyTextMessage />}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.rootPath")}</DescriptionListTerm>
        <DescriptionListDescription id="root-path">
          {customRules.rootPath || <EmptyTextMessage />}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>
          {t("analysisSteps.labels.associatedCredentials")}
        </DescriptionListTerm>
        <DescriptionListDescription id="associated-credentials">
          {customRules.associatedCredentials || <EmptyTextMessage />}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};
