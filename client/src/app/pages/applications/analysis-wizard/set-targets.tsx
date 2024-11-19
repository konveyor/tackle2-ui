import React, { useMemo } from "react";
import {
  Title,
  TextContent,
  Text,
  Gallery,
  GalleryItem,
  Form,
  Alert,
  Toolbar,
  ToolbarContent,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";

import { TargetCard } from "@app/components/target-card/target-card";
import { AnalysisWizardFormValues } from "./schema";
import { useFetchTargets } from "@app/queries/targets";
import { Application, Target } from "@app/api/models";
import { useFetchTagCategories } from "@app/queries/tags";
import { getUpdatedFormLabels, toggleSelectedTargets } from "./utils";
import { unique } from "radash";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { useSetting } from "@app/queries/settings";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { StateError } from "@app/components/StateError";
import { universalComparator } from "@app/utils/utils";
import { toLabelValue } from "@app/utils/rules-utils";

interface SetTargetsProps {
  applications: Application[];
  initialFilters?: string[];
}

const useEnhancedTargets = (applications: Application[]) => {
  const {
    targets,
    isFetching: isTargetsLoading,
    fetchError: isTargetsError,
  } = useFetchTargets();
  const { tagCategories, isFetching: isTagCategoriesLoading } =
    useFetchTagCategories();
  const { data: targetOrder = [], isLoading: isTargetOrderLoading } =
    useSetting("ui.target.order");

  const languageProviders = useMemo(
    () => unique(targets.map(({ provider }) => provider).filter(Boolean)),
    [targets]
  );

  const languageTags = useMemo(
    () =>
      tagCategories?.find((category) => category.name === "Language")?.tags ??
      [],
    [tagCategories]
  );

  const applicationProviders = useMemo(
    () =>
      unique(
        applications
          .flatMap((app) => app.tags || [])
          .filter((tag) => languageTags.find((lt) => lt.id === tag.id))
          .map((languageTag) => languageTag.name)
          .filter((language) => languageProviders.includes(language))
      ),
    [applications, languageTags, languageProviders]
  );

  // 1. missing target order setting is not a blocker (only lowers user experience)
  // 2. targets without assigned position (if any) are put at the end
  const targetsWithOrder = useMemo(
    () =>
      targets
        .map((target) => {
          const index = targetOrder.findIndex((id) => id === target.id);
          return {
            target,
            order: index === -1 ? targets.length : index,
          };
        })
        .sort((a, b) => a.order - b.order)
        .map(({ target }) => target),
    [targets, targetOrder]
  );

  return {
    // true if some queries are still fetching data for the first time (initial load)
    // note that the default re-try count (3) is used
    isLoading:
      isTagCategoriesLoading || isTargetsLoading || isTargetOrderLoading,
    // missing targets are the only blocker
    isError: !!isTargetsError,
    targets: targetsWithOrder,
    applicationProviders,
    languageProviders,
  };
};

interface SetTargetsInternalProps {
  targets: Target[];
  isLoading: boolean;
  isError: boolean;
  languageProviders: string[];
  applicationProviders: string[];
}

const SetTargetsInternal: React.FC<SetTargetsInternalProps> = ({
  targets,
  isLoading,
  isError,
  languageProviders,
  applicationProviders = [],
}) => {
  const { t } = useTranslation();

  const { watch, setValue, getValues } =
    useFormContext<AnalysisWizardFormValues>();

  const values = getValues();
  const formLabels = watch("formLabels");
  const selectedTargets = watch("selectedTargets");

  const handleOnSelectedCardTargetChange = (selectedLabelName: string) => {
    const otherSelectedLabels = formLabels?.filter((formLabel) => {
      return formLabel.name !== selectedLabelName;
    });
    const matchingLabel =
      targets
        ?.find((target) => {
          const labelNames = target?.labels?.map((label) => label.name);
          return labelNames?.includes(selectedLabelName);
        })
        ?.labels?.find((label) => label.name === selectedLabelName) || "";

    const matchingOtherLabelNames =
      targets
        ?.find((target) => {
          const labelNames = target?.labels?.map((label) => label.name);
          return labelNames?.includes(selectedLabelName);
        })
        ?.labels?.filter((label) => label.name !== selectedLabelName)
        .map((label) => label.name) || "";

    const isNewLabel = !formLabels
      .map((label) => label.name)
      .includes(selectedLabelName);
    if (isNewLabel) {
      const filterConflictingLabels = otherSelectedLabels.filter(
        (label) => !matchingOtherLabelNames.includes(label.name)
      );
      matchingLabel &&
        setValue("formLabels", [...filterConflictingLabels, matchingLabel]);
    }
  };

  const handleOnCardClick = (
    isSelecting: boolean,
    selectedLabelName: string,
    target: Target
  ) => {
    const updatedSelectedTargets = toggleSelectedTargets(
      target,
      selectedTargets
    );
    setValue("selectedTargets", updatedSelectedTargets);

    const updatedFormLabels = getUpdatedFormLabels(
      isSelecting,
      selectedLabelName,
      target,
      formLabels
    );
    setValue("formLabels", updatedFormLabels);
  };

  const tableControls = useLocalTableControls({
    tableName: "target-cards",
    items: targets,
    idProperty: "name",
    initialFilterValues: { provider: applicationProviders },
    columnNames: {
      name: "name",
      provider: "provider",
      custom: "custom",
      labels: "labels",
    },
    isFilterEnabled: true,
    isPaginationEnabled: false,
    isLoading,
    persistTo: {
      filter: {
        write(value) {
          setValue("targetFilters", value as Record<string, string[]>);
        },
        read() {
          return getValues().targetFilters;
        },
      },
    },
    filterCategories: [
      {
        selectOptions: languageProviders?.map((language) => ({
          value: language,
        })),
        placeholderText: "Filter by language...",
        categoryKey: "provider",
        title: "Languages",
        type: FilterType.multiselect,
        matcher: (filter, target) => !!target.provider?.includes(filter),
      },
      {
        placeholderText: "Filter by name...",
        categoryKey: "name",
        title: "Name",
        type: FilterType.search,
        matcher: (filter, target) =>
          !!target.name?.toLowerCase().includes(filter.toLowerCase()),
      },
      {
        placeholderText: "Filter by custom target...",
        categoryKey: "custom",
        title: "Custom target",
        type: FilterType.select,
        selectOptions: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" },
        ],
        matcher: (filter, target) => String(!!target.custom) === filter,
      },
      {
        selectOptions: unique(
          targets
            .flatMap(({ labels }) => labels ?? [])
            .map(({ name, label }) => ({
              name,
              label: toLabelValue(label),
            })),
          ({ label }) => label
        )
          .map(({ label, name }) => ({
            value: label,
            label: name,
            chipLabel: label,
          }))
          .sort((a, b) => universalComparator(a.label, b.label)),

        placeholderText: "Filter by labels...",
        categoryKey: "labels",
        title: "Labels",
        type: FilterType.multiselect,
        matcher: (filter, target) =>
          (target.labels ?? [])
            .map(({ label }) => toLabelValue(label))
            .includes(filter),
      },
    ],
  });

  const {
    currentPageItems,
    propHelpers: { toolbarProps, filterToolbarProps },
  } = tableControls;

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <TextContent>
        <Title headingLevel="h3" size="xl">
          {t("wizard.terms.setTargets")}
        </Title>
        <Text>{t("wizard.label.setTargets")}</Text>
      </TextContent>
      <Toolbar
        {...toolbarProps}
        clearAllFilters={() => filterToolbarProps.setFilterValues({})}
      >
        <ToolbarContent>
          <FilterToolbar {...filterToolbarProps} breakpoint="md" />
        </ToolbarContent>
      </Toolbar>

      {values.selectedTargets.length === 0 &&
        values.customRulesFiles.length === 0 &&
        !values.sourceRepository && (
          <Alert
            variant="warning"
            isInline
            title={t("wizard.label.skipTargets")}
          />
        )}

      {isError && <StateError />}
      {!isError && (
        <Gallery hasGutter>
          {currentPageItems.map((target) => (
            <GalleryItem key={target.id}>
              <TargetCard
                readOnly
                item={target}
                cardSelected={selectedTargets.some(
                  ({ id }) => id === target.id
                )}
                onSelectedCardTargetChange={(selectedTarget) => {
                  handleOnSelectedCardTargetChange(selectedTarget);
                }}
                onCardClick={(isSelecting, selectedLabelName, target) => {
                  handleOnCardClick(isSelecting, selectedLabelName, target);
                }}
                formLabels={formLabels}
              />
            </GalleryItem>
          ))}
        </Gallery>
      )}
    </Form>
  );
};

export const SetTargets: React.FC<SetTargetsProps> = ({ applications }) => {
  // wait for the initial load but leave error handling to the real page
  const {
    isLoading,
    targets,
    isError,
    applicationProviders,
    languageProviders,
  } = useEnhancedTargets(applications);
  if (isLoading) {
    return (
      <div style={{ marginTop: "100px" }}>
        <AppPlaceholder />
      </div>
    );
  }

  return (
    <SetTargetsInternal
      {...{
        applicationProviders,
        targets,
        isError,
        isLoading,
        languageProviders,
      }}
    />
  );
};
