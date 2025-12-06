import { type FC, useMemo } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { unique } from "radash";
import { useForm, useWatch } from "react-hook-form";
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

import { Application, Target } from "@app/api/models";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import {
  FilterSelectOptionProps,
  FilterToolbar,
  FilterType,
} from "@app/components/FilterToolbar";
import { StateError } from "@app/components/StateError";
import { TargetCard } from "@app/components/target-card/target-card";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { useFormChangeHandler } from "@app/hooks/useFormChangeHandler";
import { useFetchTagCategories } from "@app/queries/tags";
import { useFetchTargets } from "@app/queries/targets";
import { toLabelValue } from "@app/utils/rules-utils";
import { universalComparator } from "@app/utils/utils";

import {
  SetTargetsState,
  SetTargetsValues,
  useSetTargetsSchema,
} from "../schema";
import { toggleSelectedTargets, updateSelectedTargetLabels } from "../utils";

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

// TODO: Need to make sure label changes in advanced options are propagated back
//       to this form as expected. (e.g. Add a target's label should select the target)
export const SetTargets: FC<SetTargetsProps> = ({
  applications,
  onStateChanged,
  initialState,
  areCustomRulesEnabled,
}) => {
  const { t } = useTranslation();

  const {
    isLoading,
    isError,
    targets,
    targetLabelsOptions,
    applicationProviders,
    languageProviders,
  } = useTargetsData(applications);

  const schema = useSetTargetsSchema();
  const form = useForm<SetTargetsValues>({
    defaultValues: {
      selectedTargets: initialState.selectedTargets,
      selectedTargetLabels: initialState.selectedTargetLabels,
      targetFilters: initialState.targetFilters,
    },
    mode: "all",
    resolver: yupResolver(schema),
  });

  useFormChangeHandler({ form, onStateChanged });

  const { setValue } = form;
  const [selectedTargetLabels, selectedTargets] = useWatch({
    control: form.control,
    name: ["selectedTargetLabels", "selectedTargets"],
  });

  /** Handle when a target's dropdown selection changes */
  const handleOnSelectedCardTargetChange = (selectedLabelName: string) => {
    const otherSelectedLabels = selectedTargetLabels?.filter((formLabel) => {
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

    const isNewLabel = !selectedTargetLabels
      .map((label) => label.name)
      .includes(selectedLabelName);

    if (isNewLabel) {
      const filterConflictingLabels = otherSelectedLabels.filter(
        (label) => !matchingOtherLabelNames.includes(label.name)
      );
      if (matchingLabel) {
        setValue("selectedTargetLabels", [
          ...filterConflictingLabels,
          matchingLabel,
        ]);
      }
    }
  };

  /** Handle when a target card is clicked */
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

    const updatedSelectedTargetLabels = updateSelectedTargetLabels(
      isSelecting,
      selectedLabelName,
      target,
      selectedTargetLabels
    );
    setValue("selectedTargetLabels", updatedSelectedTargetLabels);
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
          form.setValue("targetFilters", value as Record<string, string[]>);
        },
        read() {
          return form.getValues("targetFilters");
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
                cardSelected={selectedTargets.some(
                  ({ id }) => id === target.id
                )}
                onSelectedCardTargetChange={(selectedTarget) => {
                  handleOnSelectedCardTargetChange(selectedTarget);
                }}
                onCardClick={(isSelecting, selectedLabelName, target) => {
                  handleOnCardClick(isSelecting, selectedLabelName, target);
                }}
                selectedTargetLabels={selectedTargetLabels}
              />
            </GalleryItem>
          ))}
        </Gallery>
      )}
    </Form>
  );
};
