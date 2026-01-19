import { type FC, useMemo } from "react";
import { unique } from "radash";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Form,
  Gallery,
  GalleryItem,
  Text,
  TextContent,
  Title,
  Toolbar,
  ToolbarContent,
} from "@patternfly/react-core";

import { Application, Target, TargetLabel } from "@app/api/models";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import {
  FilterSelectOptionProps,
  FilterToolbar,
  FilterType,
} from "@app/components/FilterToolbar";
import { StateError } from "@app/components/StateError";
import { TargetCard } from "@app/components/target-card/target-card";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { useFetchTagCategories } from "@app/queries/tags";
import { useFetchTargets } from "@app/queries/targets";
import { toLabelValue } from "@app/utils/rules-utils";
import { universalComparator } from "@app/utils/utils";

export interface SetTargetsValues {
  targetStatus: Record<
    string,
    {
      target: Target;
      isSelected: boolean;
      choiceTargetLabel?: TargetLabel;
    }
  >;
  selectedTargets: [Target, TargetLabel | null][];
  targetFilters?: Record<string, string[]>;
}

export interface SetTargetsState extends SetTargetsValues {
  isValid: boolean;
}

const useTargetsData = (applications?: Application[]) => {
  const {
    targets,
    targetsInOrder,
    isFetching: isTargetsLoading,
    fetchError: isTargetsError,
  } = useFetchTargets();

  const { tagCategories, isFetching: isTagCategoriesLoading } =
    useFetchTagCategories();

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

  // When applications are provided, filter targets by application language tags
  // When no applications (profile wizard), don't apply initial language filter
  const applicationProviders = useMemo(
    () =>
      applications && applications.length > 0
        ? unique(
            applications
              .flatMap((app) => app.tags || [])
              .filter((tag) => languageTags.find((lt) => lt.id === tag.id))
              .map((languageTag) => languageTag.name)
              .filter((language) => languageProviders.includes(language))
          )
        : [], // No initial filter when no applications
    [applications, languageTags, languageProviders]
  );

  const targetLabelsOptions: FilterSelectOptionProps[] = useMemo(
    () =>
      unique(
        targets
          .flatMap(({ labels }) => labels ?? [])
          .map(({ name, label }) => {
            const labelValue = toLabelValue(label);
            return {
              label: name,
              value: labelValue,
              chipLabel: labelValue,
            };
          }),
        ({ label }) => label
      ).sort((a, b) => universalComparator(a.label, b.label)),
    [targets]
  );

  return {
    isLoading: isTagCategoriesLoading || isTargetsLoading,
    isError: !!isTargetsError,
    targets: targetsInOrder,
    applicationProviders,
    languageProviders,
    targetLabelsOptions,
  };
};

interface SetTargetsProps {
  /**
   * Optional applications for context-aware filtering.
   * When provided, targets are initially filtered by application language tags.
   * When omitted (e.g., profile wizard), all targets are shown without initial filtering.
   */
  applications?: Application[];
  onStateChanged: (state: SetTargetsState) => void;
  state: SetTargetsState;
  areCustomRulesEnabled: boolean;
}

export const SetTargets: FC<SetTargetsProps> = ({
  applications,
  onStateChanged,
  state,
  areCustomRulesEnabled,
}) => {
  const { selectedTargets, targetStatus, targetFilters } = state;
  const { t } = useTranslation();
  const {
    isLoading,
    isError,
    targets,
    targetLabelsOptions,
    applicationProviders,
    languageProviders,
  } = useTargetsData(applications);

  /** Handle when a target card is changed (toggle selection or change the selected label) */
  const handleOnCardChange = (
    isSelecting: boolean,
    selectedLabel: TargetLabel | null,
    target: Target
  ) => {
    const nextTargetStatus = {
      ...targetStatus,
      [String(target.id)]: {
        ...(targetStatus[target.id] ?? {}),
        target,
        isSelected: isSelecting,
        choiceTargetLabel: selectedLabel ?? undefined,
      },
    };

    onStateChanged({
      ...state,
      targetStatus: nextTargetStatus,
      selectedTargets: Object.values(nextTargetStatus)
        .filter((status) => status.isSelected)
        .map((status) => [status.target, status.choiceTargetLabel ?? null]),
    });
  };

  // Only apply initial language filter when applications are provided
  const initialFilterValues =
    applications && applications.length > 0
      ? { provider: applicationProviders }
      : {};

  const tableControls = useLocalTableControls({
    tableName: "target-cards",
    items: targets,
    idProperty: "name",
    initialFilterValues,
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
          onStateChanged({
            ...state,
            targetFilters: value as Record<string, string[]>,
          });
        },
        read() {
          return targetFilters;
        },
      },
    },
    filterCategories: [
      {
        placeholderText: "Filter by language...",
        categoryKey: "provider",
        title: "Languages",
        type: FilterType.multiselect,
        selectOptions: languageProviders?.map((language) => ({
          value: language,
        })),
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
        placeholderText: "Filter by labels...",
        categoryKey: "labels",
        title: "Labels",
        type: FilterType.multiselect,
        selectOptions: targetLabelsOptions,
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

  if (isLoading) {
    return (
      <div style={{ marginTop: "100px" }}>
        <AppPlaceholder />
      </div>
    );
  }

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

      {selectedTargets.length === 0 && !areCustomRulesEnabled && (
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
                isCardSelected={targetStatus[target.id]?.isSelected ?? false}
                selectedLabel={
                  targetStatus[target.id]?.choiceTargetLabel ??
                  (target.choice && target.labels ? target.labels[0] : null)
                }
                onChange={handleOnCardChange}
              />
            </GalleryItem>
          ))}
        </Gallery>
      )}
    </Form>
  );
};
