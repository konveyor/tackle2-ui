import React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateHeader,
  EmptyStateIcon,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { Table, Tbody, Th, Thead, Tr, Td } from "@patternfly/react-table";
import { CubesIcon } from "@patternfly/react-icons";

import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { useFetchArchetypes } from "@app/queries/archetypes";

import ArchetypeApplicationsColumn from "./components/archetype-applications-column";
import ArchetypeDescriptionColumn from "./components/archetype-description-column";
import ArchetypeMaintainersColumn from "./components/archetype-maintainers-column";
import ArchetypeTagsColumn from "./components/archetype-tags-column";

const Archetypes: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { pushNotification } = React.useContext(NotificationsContext);

  const { archetypes, isFetching, error: fetchError } = useFetchArchetypes();

  const tableControls = useLocalTableControls({
    idProperty: "id",
    items: archetypes,
    isLoading: isFetching,
    hasActionsColumn: true,

    columnNames: {
      name: t("terms.name"),
      description: t("terms.description"),
      tags: t("terms.tags"),
      maintainers: t("terms.maintainers"),
      applications: t("terms.applications"),
    },

    filterCategories: [
      {
        key: "name",
        title: t("terms.name"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.name").toLowerCase(),
          }) + "...",
        getItemValue: (archetype) => {
          return archetype?.name ?? "";
        },
      },
      // TODO: Add filter for archetype tags
    ],

    sortableColumns: ["name"],
    getSortValues: (archetype) => ({
      name: archetype.name ?? "",
    }),
    initialSort: { columnKey: "name", direction: "asc" },

    hasPagination: false, // TODO: Add pagination
  });
  const {
    currentPageItems,
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      paginationProps,
      tableProps,
      getThProps,
      getTdProps,
    },
  } = tableControls;

  // TODO: RBAC access checks need to be added.  Only Architect (and Administrator) personas
  // TODO: should be able to create/edit archetypes.  Every persona should be able to view
  // TODO: the archetypes.

  const CreateButton = () => (
    <Button
      type="button"
      id="create-new-archetype"
      aria-label="Create new archetype"
      variant={ButtonVariant.primary}
      onClick={() => {}} // TODO: Add create archetype modal
    >
      {t("dialog.title.newArchetype")}
    </Button>
  );

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.archetypes")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isFetching && !(archetypes || fetchError)}
          then={<AppPlaceholder />}
        >
          <div
            style={{
              backgroundColor: "var(--pf-v5-global--BackgroundColor--100)",
            }}
          >
            <Toolbar {...toolbarProps}>
              <ToolbarContent>
                <FilterToolbar {...filterToolbarProps} />
                <ToolbarGroup variant="button-group">
                  <ToolbarItem>
                    <CreateButton />
                  </ToolbarItem>
                </ToolbarGroup>
                {/* TODO: Add pagination */}
              </ToolbarContent>
            </Toolbar>

            <Table
              {...tableProps}
              id="archetype-table"
              aria-label="Archetype table"
            >
              <Thead>
                <Tr>
                  <TableHeaderContentWithControls {...tableControls}>
                    <Th {...getThProps({ columnKey: "name" })} />
                    <Th {...getThProps({ columnKey: "description" })} />
                    <Th {...getThProps({ columnKey: "tags" })} />
                    <Th {...getThProps({ columnKey: "maintainers" })} />
                    <Th {...getThProps({ columnKey: "applications" })} />
                  </TableHeaderContentWithControls>
                </Tr>
              </Thead>
              <ConditionalTableBody
                isLoading={isFetching}
                isError={!!fetchError}
                isNoData={currentPageItems.length === 0}
                noDataEmptyState={
                  <EmptyState variant="sm">
                    <EmptyStateHeader
                      titleText="No archetypes have been created"
                      headingLevel="h2"
                      icon={<EmptyStateIcon icon={CubesIcon} />}
                    />
                    <EmptyStateBody>
                      Create a new archetype to get started.
                    </EmptyStateBody>
                    <EmptyStateFooter>
                      <CreateButton />
                    </EmptyStateFooter>
                  </EmptyState>
                }
                numRenderedColumns={numRenderedColumns}
              >
                {currentPageItems?.map((archetype, rowIndex) => (
                  <Tbody key={archetype.id}>
                    <Tr>
                      <TableRowContentWithControls
                        {...tableControls}
                        item={archetype}
                        rowIndex={rowIndex}
                      >
                        <Td {...getTdProps({ columnKey: "name" })}>
                          {archetype.name}
                        </Td>
                        <Td {...getTdProps({ columnKey: "description" })}>
                          <ArchetypeDescriptionColumn archetype={archetype} />
                        </Td>
                        <Td {...getTdProps({ columnKey: "tags" })}>
                          <ArchetypeTagsColumn archetype={archetype} />
                        </Td>
                        <Td {...getTdProps({ columnKey: "maintainers" })}>
                          <ArchetypeMaintainersColumn archetype={archetype} />
                        </Td>
                        <Td {...getTdProps({ columnKey: "applications" })}>
                          <ArchetypeApplicationsColumn archetype={archetype} />
                        </Td>
                        <Td>{/* TODO: Add kebab action menu */}</Td>
                      </TableRowContentWithControls>
                    </Tr>
                  </Tbody>
                ))}
              </ConditionalTableBody>
            </Table>

            {/* TODO: Add pagination */}
          </div>
        </ConditionalRender>
      </PageSection>

      {/* TODO: Add create/edit modal */}
      {/* TODO: Add duplicate confirm modal */}
      {/* TODO: Add delete confirm modal */}
    </>
  );
};

export default Archetypes;
