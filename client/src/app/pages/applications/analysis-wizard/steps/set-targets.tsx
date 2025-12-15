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

import { SetTargetsState } from "../schema";

const useTargetsData = (applications: Application[]) => {
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
  applications: Application[];
  onStateChanged: (state: SetTargetsState) => void;
  initialState: SetTargetsState;
  areCustomRulesEnabled: boolean;
}

export const SetTargets: FC<SetTargetsProps> = ({
  applications,
  onStateChanged,
  initialState,
  areCustomRulesEnabled,
}) => {
  const { selectedTargets, targetFilters } = initialState;
  const { t } = useTranslation();
  const {
    isLoading,
    isError,
    targets,
    targetLabelsOptions,
    applicationProviders,
    languageProviders,
  } = useTargetsData(applications);

  const isTargetSelected = (target: Target) => {
    return selectedTargets.some(
      ([selectedTarget, _]) => selectedTarget.id === target.id
    );
  };

  const getSelectedTargetLabel = (target: Target) => {
    const [_, selectedLabel] =
      selectedTargets.find(([{ id }, _]) => id === target.id) ?? [];
    return selectedLabel ?? null;
  };

  /** Handle when a target card is changed (toggle selection or change the selected label) */
  const handleOnCardChange = (
    isSelecting: boolean,
    selectedLabel: TargetLabel | null,
    target: Target
  ) => {
    const nextSelectedTargets = [...selectedTargets];
    const index = nextSelectedTargets.findIndex(([t]) => t.id === target.id);
    if (isSelecting && index === -1) {
      nextSelectedTargets.push([target, selectedLabel]); // add
    }
    if (isSelecting && index > -1) {
      nextSelectedTargets.splice(index, 1, [target, selectedLabel]); // update
    }
    if (!isSelecting && index > -1) {
      nextSelectedTargets.splice(index, 1); // remove
    }
    onStateChanged({ ...initialState, selectedTargets: nextSelectedTargets });
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
          onStateChanged({
            ...initialState,
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
                isCardSelected={isTargetSelected(target)}
                selectedLabel={getSelectedTargetLabel(target)}
                onChange={handleOnCardChange}
              />
            </GalleryItem>
          ))}
        </Gallery>
      )}
    </Form>
  );
};
