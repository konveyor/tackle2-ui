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
  Bullseye,
  Spinner,
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
import { ConditionalTableBody } from "@app/components/TableControls";

interface SetTargetsProps {
  applications: Application[];
  initialFilters?: string[];
}

const useEnhancedTargets = (applications: Application[]) => {
  const {
    targets,
    isFetching: isTargetsFetching,
    fetchError: isTargetsError,
  } = useFetchTargets();
  const { tagCategories, isFetching: isTagCategoriesFetching } =
    useFetchTagCategories();

  const languageProviders = useMemo(
    () => unique(targets.map(({ provider }) => provider).filter(Boolean)),
    [targets]
  );

  const languageTags =
    tagCategories?.find((category) => category.name === "Language")?.tags ?? [];

  const applicationProviders = unique(
    applications
      .flatMap((app) => app.tags || [])
      .filter((tag) => languageTags.find((lt) => lt.id === tag.id))
      .map((languageTag) => languageTag.name)
      .filter((language) => languageProviders.includes(language))
  );
  return {
    isFetching: isTagCategoriesFetching || isTargetsFetching,
    isError: !!isTargetsError,
    targets,
    applicationProviders: [...applicationProviders, "foo"],
    languageProviders: [...languageProviders, "foo"],
  };
};

const SetTargetsInternal: React.FC<SetTargetsProps> = ({
  applications,
  initialFilters = [],
}) => {
  const { t } = useTranslation();

  const { targets, isFetching, isError, languageProviders } =
    useEnhancedTargets(applications);

  const { watch, setValue, getValues } =
    useFormContext<AnalysisWizardFormValues>();

  const values = getValues();
  const formLabels = watch("formLabels");
  const selectedTargets = watch("selectedTargets");

  // TODO: re-enable
  // const targetOrderSetting = useSetting("ui.target.order");

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
    initialFilterValues: { name: initialFilters },
    columnNames: {
      name: "name",
    },
    isFilterEnabled: true,
    isLoading: isFetching,
    filterCategories: [
      {
        selectOptions: languageProviders?.map((language) => ({
          value: language,
        })),
        placeholderText: "Filter by language...",
        categoryKey: "name",
        title: "Languages",
        type: FilterType.multiselect,
        matcher: (filter, target) => !!target.provider?.includes(filter),
        logicOperator: "OR",
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
          <FilterToolbar {...filterToolbarProps} />
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
      <ConditionalTableBody
        isLoading={isFetching}
        isError={isError}
        isNoData={targets.length === 0}
        numRenderedColumns={1}
      >
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
      </ConditionalTableBody>
    </Form>
  );
};

export const SetTargets: React.FC<SetTargetsProps> = ({ applications }) => {
  // pre-fetch data but leave error handling to the real page
  const { isFetching, applicationProviders } = useEnhancedTargets(applications);
  if (isFetching) {
    return (
      <Bullseye>
        <Spinner size="xl" />
      </Bullseye>
    );
  }
  return (
    <SetTargetsInternal
      applications={applications}
      initialFilters={applicationProviders}
    />
  );
};
