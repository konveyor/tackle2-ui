import * as React from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  LabelGroup,
  Text,
} from "@patternfly/react-core";

import { AnalysisProfile, AnalysisProfileTarget, Ref } from "@app/api/models";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import {
  DrawerTabContent,
  DrawerTabContentSection,
  RepositoryDetails,
} from "@app/components/detail-drawer";
import { useFetchTargets } from "@app/queries/targets";

/** Helper to display a list of string labels */
const StringLabels: React.FC<{ items?: string[]; color?: string }> = ({
  items,
  color = "grey",
}) => {
  const { t } = useTranslation();

  if (items && items.length > 0) {
    return (
      <LabelGroup>
        {items.map((item, index) => (
          <Label key={index} color={color as "grey" | "blue" | "green"}>
            {item}
          </Label>
        ))}
      </LabelGroup>
    );
  }
  return <EmptyTextMessage message={t("terms.none")} />;
};

/** Display targets with their resolved names */
// TODO: Better display of targets and with their labels
const TargetsList: React.FC<{
  targetRefs?: AnalysisProfileTarget[];
}> = ({ targetRefs }) => {
  const { t } = useTranslation();
  const { targets } = useFetchTargets();

  // Cross-reference the Refs with the full Target objects to get full details
  const resolvedTargets = useMemo(() => {
    if (!targetRefs || targetRefs.length === 0) return [];

    return targetRefs.map((ref) => {
      const fullTarget = targets.find((t) => t.id === ref.id);
      return {
        id: ref.id,
        name: fullTarget?.name ?? ref.name,
        description: fullTarget?.description,
        provider: fullTarget?.provider,
        selection:
          fullTarget?.choice && ref.selection
            ? fullTarget?.labels?.find((l) => l.label === ref.selection)?.name
            : undefined,
      };
    });
  }, [targetRefs, targets]);

  if (resolvedTargets.length === 0) {
    return <EmptyTextMessage message={t("terms.none")} />;
  }

  return (
    <LabelGroup>
      {resolvedTargets.map((target) => (
        <Label key={target.id} color="blue">
          {target.name}
          {target.provider && ` (${target.provider})`}
          {target.selection && ` (${target.selection})`}
        </Label>
      ))}
    </LabelGroup>
  );
};

// TODO: Better display of files (more info than just the name from the Ref)
const FilesList: React.FC<{ fileRefs?: Ref[] }> = ({ fileRefs }) => {
  const { t } = useTranslation();
  // const { files } = useFetchFiles();

  if (!fileRefs || fileRefs.length === 0) {
    return <EmptyTextMessage message={t("terms.none")} />;
  }

  return (
    <LabelGroup>
      {fileRefs.map((fileRef) => (
        <Label key={fileRef.id} color="grey">
          {fileRef.name}
        </Label>
      ))}
    </LabelGroup>
  );
};

const CompactDescriptionList: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <DescriptionList
      isHorizontal
      isCompact
      columnModifier={{ default: "1Col" }}
      horizontalTermWidthModifier={{
        default: "15ch",
      }}
    >
      {children}
    </DescriptionList>
  );
};

export const TabDetailsContent: React.FC<{
  analysisProfile: AnalysisProfile;
}> = ({ analysisProfile }) => {
  const { t } = useTranslation();

  // Fetch all targets to cross-reference with the profile's target refs

  const ruleLabelsIncluded =
    analysisProfile.rules?.labels?.included?.slice(0) ?? [];
  ruleLabelsIncluded.sort();

  const ruleLabelsExcluded =
    analysisProfile.rules?.labels?.excluded?.slice(0) ?? [];
  ruleLabelsExcluded.sort();

  return (
    <DrawerTabContent>
      {/* Description */}
      <DrawerTabContentSection label={t("terms.description")}>
        <Text>{analysisProfile.description || <EmptyTextMessage />}</Text>
      </DrawerTabContentSection>

      {/* Mode */}
      <DrawerTabContentSection label={t("analysisProfiles.sectionMode")}>
        <CompactDescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.withDeps")}</DescriptionListTerm>
            <DescriptionListDescription>
              {analysisProfile.mode?.withDeps ? t("terms.yes") : t("terms.no")}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </CompactDescriptionList>
      </DrawerTabContentSection>

      {/* Scope */}
      <DrawerTabContentSection label={t("analysisProfiles.sectionScope")}>
        <CompactDescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>
              {t("terms.withKnownLibs")}
            </DescriptionListTerm>
            <DescriptionListDescription>
              {analysisProfile.scope?.withKnownLibs
                ? t("terms.yes")
                : t("terms.no")}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>
              {t("terms.packagesIncluded")}
            </DescriptionListTerm>
            <DescriptionListDescription>
              {(analysisProfile.scope?.packages?.included?.length ?? 0) > 0 ? (
                <StringLabels
                  items={analysisProfile.scope?.packages?.included}
                  color="green"
                />
              ) : (
                <EmptyTextMessage message={t("analysisProfiles.none")} />
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>
              {t("terms.packagesExcluded")}
            </DescriptionListTerm>
            <DescriptionListDescription>
              {(analysisProfile.scope?.packages?.excluded?.length ?? 0) > 0 ? (
                <StringLabels
                  items={analysisProfile.scope?.packages?.excluded}
                  color="grey"
                />
              ) : (
                <EmptyTextMessage message={t("analysisProfiles.none")} />
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </CompactDescriptionList>
      </DrawerTabContentSection>

      {/* Rules - Targets */}
      <DrawerTabContentSection
        label={t("analysisProfiles.sectionRulesTargets")}
      >
        {analysisProfile.rules?.targets ? (
          <TargetsList targetRefs={analysisProfile.rules?.targets} />
        ) : (
          <EmptyTextMessage />
        )}
      </DrawerTabContentSection>

      {/* Rules - Repository */}
      <DrawerTabContentSection
        label={t("analysisProfiles.sectionRulesRepository")}
      >
        {analysisProfile.rules?.repository ? (
          <RepositoryDetails repository={analysisProfile.rules.repository} />
        ) : (
          <EmptyTextMessage message={t("analysisProfiles.none")} />
        )}
      </DrawerTabContentSection>

      {/* Rules - Files */}
      <DrawerTabContentSection label={t("analysisProfiles.sectionRulesFiles")}>
        {analysisProfile.rules?.files ? (
          <FilesList fileRefs={analysisProfile.rules?.files} />
        ) : (
          <EmptyTextMessage message={t("analysisProfiles.none")} />
        )}
      </DrawerTabContentSection>

      {/* Rules - Labels */}
      <DrawerTabContentSection label={t("analysisProfiles.sectionRulesLabels")}>
        <CompactDescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.included")}</DescriptionListTerm>
            <DescriptionListDescription>
              {ruleLabelsIncluded.length > 0 ? (
                <StringLabels items={ruleLabelsIncluded} color="green" />
              ) : (
                <EmptyTextMessage message={t("analysisProfiles.none")} />
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.excluded")}</DescriptionListTerm>
            <DescriptionListDescription>
              {ruleLabelsExcluded.length > 0 ? (
                <StringLabels items={ruleLabelsExcluded} color="grey" />
              ) : (
                <EmptyTextMessage message={t("analysisProfiles.none")} />
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </CompactDescriptionList>
      </DrawerTabContentSection>
    </DrawerTabContent>
  );
};
