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
import { FilterIcon } from "@patternfly/react-icons/dist/esm/icons/filter-icon";
import { TrashIcon } from "@patternfly/react-icons/dist/esm/icons/trash-icon";

import { AddCustomRules } from "./components/add-custom-rules";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { Rule } from "@app/api/models";
import { NoDataEmptyState } from "@app/shared/components";

import "./custom-rules.css";

export const CustomRules: React.FunctionComponent = () => {
  const [isAddCustomRulesModalOpen, setCustomRulesModalOpen] =
    React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);

  const rules: Rule[] = [];

  const filterCategories: FilterCategory<Rule>[] = [
    {
      key: "name",
      title: "Name",
      type: FilterType.search,
      placeholderText: "Filter by name...",
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
      title: "name",
      transforms: [cellWidth(20)],
    },
    { title: "Source / Target", transforms: [cellWidth(20)] },
    { title: "Number of rules", transforms: [cellWidth(10)] },
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
              `${item.source} / ${item.target}`
            </TableText>
          ),
        },
        {
          title: <TableText wrapModifier="truncate">{item.total}</TableText>,
        },
        {
          title: (
            <div className="pf-c-inline-edit__action pf-m-enable-editable">
              <Button type="button" variant="plain" onClick={() => item}>
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
          Custom rules
        </Title>
        <Text>Upload the rules you want to include in the analysis.</Text>
      </TextContent>
      <div className="foo">
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
                  type="button"
                  aria-label="create-application"
                  variant="primary"
                  onClick={() => setCustomRulesModalOpen(true)}
                >
                  Add rule
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      </div>
      {filteredItems.length > 0 ? (
        <Table
          aria-label="Migration Plans table"
          className="plans-table"
          cells={columns}
          rows={rows}
        >
          <TableHeader />
          <TableBody />
        </Table>
      ) : (
        <NoDataEmptyState
          title="No custom rules available"
          description={"Add rules"}
        />
      )}
      {isAddCustomRulesModalOpen && (
        <Modal
          isOpen={isAddCustomRulesModalOpen}
          variant="medium"
          title="Add rules"
          onClose={() => setCustomRulesModalOpen(false)}
          actions={[
            <Button
              key="add"
              variant="primary"
              onClick={(event) => {
                console.log(files);
                setCustomRulesModalOpen(false);
                return;
              }}
            >
              Add
            </Button>,
            <Button
              key="cancel"
              variant="link"
              onClick={() => setCustomRulesModalOpen(false)}
            >
              Cancel
            </Button>,
          ]}
        >
          <AddCustomRules currentFiles={files} setCurrentFiles={setFiles} />
        </Modal>
      )}
    </>
  );
};
