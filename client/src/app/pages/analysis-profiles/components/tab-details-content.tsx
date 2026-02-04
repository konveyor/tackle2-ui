import * as React from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
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

import { StringLabels } from "./string-labels";

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
    <StringLabels
      overflowLabelCount={3}
      color="blue"
      items={resolvedTargets.map(
        (target) =>
          `${target.name}${target.provider ? ` (${target.provider})` : ""}${target.selection ? ` (${target.selection})` : ""}`
      )}
    />
  );
};

// TODO: Better display of files (more info than just the name from the Ref)
const FilesList: React.FC<{ fileRefs?: Ref[] }> = ({ fileRefs }) => {
  // const { files } = useFetchFiles();

  return (
    <StringLabels
      items={fileRefs?.map((fileRef) => fileRef.name) ?? []}
      overflowLabelCount={3}
    />
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
              <StringLabels
                items={analysisProfile.scope?.packages?.included}
                color="green"
                overflowLabelCount={3}
              />
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>
              {t("terms.packagesExcluded")}
            </DescriptionListTerm>
            <DescriptionListDescription>
              <StringLabels
                items={analysisProfile.scope?.packages?.excluded}
                color="grey"
                overflowLabelCount={3}
              />
            </DescriptionListDescription>
          </DescriptionListGroup>
        </CompactDescriptionList>
      </DrawerTabContentSection>

      {/* Rules - Targets */}
      <DrawerTabContentSection
        label={t("analysisProfiles.sectionRulesTargets")}
      >
        <TargetsList targetRefs={analysisProfile.rules?.targets} />
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
        <FilesList fileRefs={analysisProfile.rules?.files} />
      </DrawerTabContentSection>

      {/* Rules - Labels */}
      <DrawerTabContentSection label={t("analysisProfiles.sectionRulesLabels")}>
        <CompactDescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.included")}</DescriptionListTerm>
            <DescriptionListDescription>
              <StringLabels
                items={ruleLabelsIncluded}
                color="green"
                overflowLabelCount={3}
              />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.excluded")}</DescriptionListTerm>
            <DescriptionListDescription>
              <StringLabels
                items={ruleLabelsExcluded}
                color="grey"
                overflowLabelCount={3}
              />
            </DescriptionListDescription>
          </DescriptionListGroup>
        </CompactDescriptionList>
      </DrawerTabContentSection>
    </DrawerTabContent>
  );
};
