import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Tooltip,
} from "@patternfly/react-core";
import { TrashIcon } from "@patternfly/react-icons";
import {
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  TrProps,
} from "@patternfly/react-table";

import { UploadFile } from "@app/api/models";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { getParsedLabel, parseRules } from "@app/utils/rules-utils";
const CustomRulesTable: React.FC<{
  customRulesFiles: UploadFile[];
  onAddRulesFiles: () => void;
  setCustomRulesFiles: (customRulesFiles: UploadFile[]) => void;
}> = ({ customRulesFiles, onAddRulesFiles, setCustomRulesFiles }) => {
  const { t } = useTranslation();
  const onRemoveRuleFileName = (ruleFileName: string) => {
    // Remove the rule file from `customRulesFiles`
    const newCustomRulesFiles = customRulesFiles.filter(
      (file) => file.fileName !== ruleFileName
    );
    setCustomRulesFiles(newCustomRulesFiles);
  };

  const tableControls = useLocalTableControls({
    tableName: "custom-rules-table",
    idProperty: "fileName",
    items: customRulesFiles,
    isFilterEnabled: true,
    hasActionsColumn: true,
    filterCategories: [
      {
        categoryKey: "name",
        title: t("terms.name"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.name").toLowerCase(),
          }) + "...",
        getItemValue: (item) => {
          return item?.fileName || "";
        },
      },
    ],
    columnNames: {
      name: t("terms.name"),
      sourceTarget: `${t("wizard.terms.source", { count: 2 })} / ${t("wizard.terms.target", { count: 2 })}`,
      numberOfRules: t("wizard.terms.numberOfRules"),
    },
    variant: "compact",
  });
  const {
    currentPageItems,
    numRenderedColumns,

    propHelpers: {
      filterToolbarProps,
      tableProps,
      getThProps,
      getTrProps,
      getTdProps,
      toolbarProps,
    },
  } = tableControls;

  const toValues = (item: UploadFile): [TrProps, string, string, number] => {
    const { source, target, total } = parseRules(item);

    const sources = getParsedLabel(source).labelValue || t("wizard.terms.none");
    const targets = getParsedLabel(target).labelValue || t("wizard.terms.none");
    const sourceTargetLabel = `${sources} / ${targets}`;
    return [getTrProps({ item }), item.fileName, sourceTargetLabel, total];
  };
  return (
    <>
      <Toolbar
        {...toolbarProps}
        clearAllFilters={() => filterToolbarProps.setFilterValues({})}
      >
        <ToolbarContent>
          <FilterToolbar {...filterToolbarProps} />
          <ToolbarItem>
            <Button
              type="button"
              aria-label={t("composed.add", {
                what: t("wizard.terms.rules").toLowerCase(),
              })}
              variant="primary"
              onClick={onAddRulesFiles}
            >
              {t("composed.add", {
                what: t("wizard.terms.rules").toLowerCase(),
              })}
            </Button>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <Table {...tableProps} aria-label={t("wizard.label.customRulesTable")}>
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "name" })} />
              <Th {...getThProps({ columnKey: "sourceTarget" })} />
              <Th {...getThProps({ columnKey: "numberOfRules" })} />
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isNoData={currentPageItems.length === 0}
          numRenderedColumns={numRenderedColumns}
          noDataEmptyState={
            <NoDataEmptyState
              title={t("wizard.label.noCustomRules")}
              description={t("composed.add", {
                what: t("wizard.terms.rules").toLowerCase(),
              })}
            />
          }
        >
          <Tbody>
            {currentPageItems
              .map(toValues)
              .map(([trProps, fileName, sourceTargetLabel, numberOfRules]) => (
                <Tr {...trProps} key={fileName}>
                  <Td
                    {...getTdProps({ columnKey: "name" })}
                    modifier="truncate"
                  >
                    {fileName}
                  </Td>
                  <Td
                    {...getTdProps({ columnKey: "sourceTarget" })}
                    modifier="truncate"
                  >
                    {sourceTargetLabel}
                  </Td>
                  <Td {...getTdProps({ columnKey: "numberOfRules" })}>
                    {numberOfRules}
                  </Td>
                  <Td isActionCell>
                    <Tooltip content={t("actions.delete")}>
                      <Button
                        type="button"
                        variant="plain"
                        aria-label={t("actions.delete")}
                        onClick={() => onRemoveRuleFileName(fileName)}
                        icon={<TrashIcon />}
                      />
                    </Tooltip>
                  </Td>
                </Tr>
              ))}
          </Tbody>
        </ConditionalTableBody>
      </Table>
    </>
  );
};

export default CustomRulesTable;
