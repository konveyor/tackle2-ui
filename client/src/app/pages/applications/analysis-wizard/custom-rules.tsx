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

import { AddCustomRules } from "../../../common/CustomRules/add-custom-rules";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { IReadFile, TableRule } from "@app/api/models";
import { NoDataEmptyState } from "@app/shared/components/no-data-empty-state";

import "./wizard.css";
import { AnalysisWizardFormValues } from "./schema";
import { parseRules } from "@app/common/CustomRules/rules-utils";
import { TASKGROUPS } from "@app/api/rest";
interface CustomRulesProps {
  taskgroupID: number | null;
}
export const CustomRules: React.FC<CustomRulesProps> = (props) => {
  const { t } = useTranslation();

  const { watch, setValue } = useFormContext<AnalysisWizardFormValues>();

  const { formSources, formTargets, customRulesFiles } = watch();

  const [tableRules, setTableRules] = React.useState<TableRule[]>([]);
  const [readFileData, setReadFileData] = React.useState<IReadFile[]>([]);
  const [isAddCustomRulesModalOpen, setCustomRulesModalOpen] =
    React.useState(false);

  const onCloseCustomRuleModal = () => {
    setCustomRulesModalOpen(false);
    setReadFileData([]);
  };

  const filterCategories: FilterCategory<TableRule>[] = [
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
    tableRules || [],
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
                id="remove-rule-button"
                type="button"
                variant="plain"
                onClick={() => {
                  // Remove rule file from list
                  const updatedFileList = customRulesFiles.filter(
                    (file) => file.fileName !== item.name
                  );
                  setValue("customRulesFiles", updatedFileList);
                  refreshRulesData(updatedFileList);
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
  const refreshRulesData = (updatedCustomRulesFiles: IReadFile[]) => {
    let rules: TableRule[] = [];

    updatedCustomRulesFiles.forEach((file) => {
      if (file.data) {
        const newRules = parseRules(file);
        if (newRules.parsedRuleset) rules = [...rules, newRules.parsedRuleset];
        if (
          newRules.parsedSource &&
          !formSources.includes(newRules.parsedSource)
        ) {
          setValue("formSources", [...formSources, newRules.parsedSource]);
        }
        if (
          newRules.parsedTarget &&
          !formTargets.includes(newRules.parsedTarget)
        ) {
          setValue("formTargets", [...formTargets, newRules.parsedTarget]);
        }
      }
    });
    setTableRules(rules.flat());
  };

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
              <FilterToolbar<TableRule>
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
                const updatedCustomRulesFiles = [
                  ...customRulesFiles,
                  ...validFiles,
                ];
                setValue("customRulesFiles", updatedCustomRulesFiles);
                refreshRulesData(updatedCustomRulesFiles);
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
            taskgroupID={props.taskgroupID}
          />
        </Modal>
      )}
    </>
  );
};
