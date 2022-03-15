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
import { IReadFile } from "./components/add-custom-rules";

import "./custom-rules.css";
import { UseFormGetValues } from "react-hook-form";
import { IFormValues } from "./analysis-wizard";

interface ICustomRules {
  customRulesFiles: IReadFile[];
  setValue: (files: IReadFile[]) => void;
}

export const CustomRules: React.FunctionComponent<ICustomRules> = ({
  customRulesFiles,
  setValue,
}) => {
  const [isAddCustomRulesModalOpen, setCustomRulesModalOpen] =
    React.useState(false);

  const rules = React.useMemo(() => {
    const getRules = (file: IReadFile) => {
      if (!file.data) return [];

      let source = "";
      let target = "";
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
      return rules;
    };

    let rules: Rule[] = [];
    customRulesFiles.forEach((file) => {
      if (file.data) rules = [...rules, ...getRules(file)];
    });

    return rules.flat();
  }, [customRulesFiles]);

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
                  setValue(fileList);
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
                  aria-label="add-rules"
                  variant="primary"
                  onClick={() => setCustomRulesModalOpen(true)}
                >
                  Add rules
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
          <AddCustomRules
            readFileData={customRulesFiles}
            setReadFileData={setValue}
          />
        </Modal>
      )}
    </>
  );
};
