import * as React from "react";
import {
  Button,
  Modal,
  Text,
  TextContent,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  ToolbarToggleGroup,
} from "@patternfly/react-core";
import {
  cellWidth,
  ICell,
  IRow,
  Table,
  TableBody,
  TableHeader,
  TableText,
} from "@patternfly/react-table";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FilterIcon from "@patternfly/react-icons/dist/esm/icons/filter-icon";
import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";

import { AddCustomRules } from "./components/add-custom-rules";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { Rule } from "@app/api/models";
import { NoDataEmptyState } from "@app/shared/components/no-data-empty-state";
import { IReadFile } from "./analysis-wizard";

import "./wizard.css";
import { AnalysisWizardFormValues } from "./schema";

export const CustomRules: React.FC = () => {
  const { t } = useTranslation();

  const { watch, setValue } = useFormContext<AnalysisWizardFormValues>();

  const { sources, targets, customRulesFiles } = watch();

  const [rules, setRules] = React.useState<Rule[]>([]);
  const [readFileData, setReadFileData] = React.useState<IReadFile[]>([]);
  const [isAddCustomRulesModalOpen, setCustomRulesModalOpen] =
    React.useState(false);

  const onCloseCustomRuleModal = () => {
    setCustomRulesModalOpen(false);
    setReadFileData([]);
  };

  React.useEffect(() => {
    const getRules = (file: IReadFile) => {
      if (!file.data) return [];

      let source: string | null = null;
      let target: string | null = null;
      let rulesCount = 0;

      const payload = atob(file.data.substring(21));
      const parser = new DOMParser();
      const xml = parser.parseFromString(payload, "text/xml");

      const ruleSets = xml.getElementsByTagName("ruleset");

      if (ruleSets && ruleSets.length > 0) {
        const metadata = ruleSets[0].getElementsByTagName("metadata");

        if (metadata && metadata.length > 0) {
          const sources = metadata[0].getElementsByTagName("sourceTechnology");
          if (sources && sources.length > 0) source = sources[0].id;

          const targets = metadata[0].getElementsByTagName("targetTechnology");
          if (targets && targets.length > 0) target = targets[0].id;
        }

        const rulesGroup = ruleSets[0].getElementsByTagName("rules");
        if (rulesGroup && rulesGroup.length > 0)
          rulesCount = rulesGroup[0].getElementsByTagName("rule").length;
      }

      const rules: Rule[] = [
        {
          name: file.fileName,
          source: source,
          target: target,
          total: rulesCount,
        },
      ];

      if (source && !sources.includes(source))
        setValue("sources", [...sources, source]);

      if (target && !targets.includes(target))
        setValue("targets", [...targets, target]);

      return rules;
    };

    let rules: Rule[] = [];
    customRulesFiles.forEach((file) => {
      if (file.data) rules = [...rules, ...getRules(file)];
    });

    setRules(rules.flat());
  }, [customRulesFiles, sources, targets, setValue]);

  const filterCategories: FilterCategory<Rule>[] = [
    {
      key: "name",
      title: t("terms.name"),
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.name").toLowerCase(),
        }) + "...",
      getItemValue: (item) => {
        return item?.name || "";
      },
    },
  ];

  const { filterValues, setFilterValues, filteredItems } = useFilterState(
    rules || [],
    filterCategories
  );

  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  // Table
  const columns: ICell[] = [
    {
      title: t("terms.name"),
      transforms: [cellWidth(20)],
    },
    {
      title: `${t("wizard.terms.source")} /  ${t("wizard.terms.target")}`,
      transforms: [cellWidth(20)],
    },
    { title: t("wizard.terms.numberOfRules"), transforms: [cellWidth(10)] },
    {
      title: "",
      props: {
        className: "pf-c-table__inline-edit-action",
      },
    },
  ];

  const rows: IRow[] = [];
  filteredItems?.forEach((item) => {
    rows.push({
      entity: item,
      cells: [
        {
          title: <TableText wrapModifier="truncate">{item.name}</TableText>,
        },
        {
          title: (
            <TableText wrapModifier="truncate">
              {item.source} / {item.target}
            </TableText>
          ),
        },
        {
          title: <TableText wrapModifier="truncate">{item.total}</TableText>,
        },
        {
          title: (
            <div className="pf-c-inline-edit__action pf-m-enable-editable">
              <Button
                type="button"
                variant="plain"
                onClick={() => {
                  const fileList = customRulesFiles.filter(
                    (file) => file.fileName !== item.name
                  );
                  setValue("customRulesFiles", fileList);
                }}
              >
                <TrashIcon />
              </Button>
            </div>
          ),
        },
      ],
    });
  });

  return (
    <>
      <TextContent>
        <Title headingLevel="h3" size="xl">
          {t("wizard.terms.customRules")}
        </Title>
        <Text> {t("wizard.label.customRules")}</Text>
      </TextContent>
      <div className="line">
        <Toolbar
          className="pf-m-toggle-group-container"
          collapseListedFiltersBreakpoint="xl"
          clearAllFilters={handleOnClearAllFilters}
          clearFiltersButtonText="clear Filter"
        >
          <ToolbarContent>
            <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
              <FilterToolbar<Rule>
                filterCategories={filterCategories}
                filterValues={filterValues}
                setFilterValues={setFilterValues}
              />
            </ToolbarToggleGroup>
            <ToolbarGroup variant="button-group">
              <ToolbarItem>
                <Button
                  id="add-rules"
                  type="button"
                  aria-label="add rules"
                  variant="primary"
                  onClick={() => setCustomRulesModalOpen(true)}
                >
                  {
                    // t("wizard.terms.rules")
                    t("composed.add", {
                      what: t("wizard.terms.rules").toLowerCase(),
                    })
                  }
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      </div>
      {filteredItems.length > 0 ? (
        <Table
          aria-label="Custom rules table"
          className="custom-rules-table"
          cells={columns}
          rows={rows}
        >
          <TableHeader />
          <TableBody />
        </Table>
      ) : (
        <NoDataEmptyState
          title={t("wizard.label.noCustomRules")}
          description={t("composed.add", {
            what: t("wizard.terms.rules").toLowerCase(),
          })}
        />
      )}
      {isAddCustomRulesModalOpen && (
        <Modal
          isOpen={isAddCustomRulesModalOpen}
          variant="medium"
          title="Add rules"
          onClose={onCloseCustomRuleModal}
          actions={[
            <Button
              key="add"
              variant="primary"
              isDisabled={
                !readFileData.find((file) => file.loadResult === "success")
              }
              onClick={(event) => {
                setCustomRulesModalOpen(false);
                const validFiles = readFileData.filter(
                  (file) => file.loadResult === "success"
                );
                setValue("customRulesFiles", [
                  ...customRulesFiles,
                  ...validFiles,
                ]);
                setReadFileData([]);
              }}
            >
              Add
            </Button>,
            <Button
              key="cancel"
              variant="link"
              onClick={onCloseCustomRuleModal}
            >
              Cancel
            </Button>,
          ]}
        >
          <AddCustomRules
            customRulesFiles={customRulesFiles}
            readFileData={readFileData}
            setReadFileData={setReadFileData}
          />
        </Modal>
      )}
    </>
  );
};
