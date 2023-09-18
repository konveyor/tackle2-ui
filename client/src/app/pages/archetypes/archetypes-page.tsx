import React, { useState } from "react";
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
  Modal,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  Table,
  Tbody,
  Th,
  Thead,
  Tr,
  Td,
  ActionsColumn,
} from "@patternfly/react-table";
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
import {
  useDeleteArchetypeMutation,
  useFetchArchetypes,
} from "@app/queries/archetypes";

import ArchetypeApplicationsColumn from "./components/archetype-applications-column";
import ArchetypeDescriptionColumn from "./components/archetype-description-column";
import ArchetypeForm from "./components/archetype-form";
import ArchetypeMaintainersColumn from "./components/archetype-maintainers-column";
import ArchetypeTagsColumn from "./components/archetype-tags-column";
import { Archetype } from "@app/api/models";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { formatPath, getAxiosErrorMessage } from "@app/utils/utils";
import { AxiosError } from "axios";
import { Paths } from "@app/Paths";

const Archetypes: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { pushNotification } = React.useContext(NotificationsContext);

  const [openCreateArchetype, setOpenCreateArchetype] =
    useState<boolean>(false);

  const [archetypeToEdit, setArchetypeToEdit] = useState<Archetype | null>(
    null
  );

  const [archetypeToDuplicate, setArchetypeToDuplicate] =
    useState<Archetype | null>(null);

  const { archetypes, isFetching, error: fetchError } = useFetchArchetypes();

  const onError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const [archetypeToDelete, setArchetypeToDelete] =
    React.useState<Archetype | null>(null);
  const { mutate: deleteArchetype } = useDeleteArchetypeMutation(
    (archetypeDeleted) =>
      pushNotification({
        title: t("toastr.success.deletedWhat", {
          what: archetypeDeleted.name,
          type: t("terms.archetype"),
        }),
        variant: "success",
      }),
    onError
  );

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
      onClick={() => setOpenCreateArchetype(true)}
    >
      {t("dialog.title.newArchetype")}
    </Button>
  );
  const [isOverrideModalOpen, setOverrideModalOpen] = React.useState(false);
  const [archetypeToAssess, setArchetypeToAssess] =
    React.useState<Archetype | null>(null);

  const assessSelectedArchetype = (archetype: Archetype) => {
    // if application/archetype has an assessment, ask if user wants to override it
    const matchingAssessment = false;
    if (matchingAssessment) {
      setOverrideModalOpen(true);
      setArchetypeToAssess(archetype);
    } else {
      archetype?.id &&
        history.push(
          formatPath(Paths.archetypeAssessmentActions, {
            archetypeId: archetype?.id,
          })
        );
      setArchetypeToAssess(null);
    }
  };
  const reviewSelectedArchetype = (archetype: Archetype) => {
    //TODO: Review archetype
    // if (application.review) {
    //   setReviewToEdit(application.id);
    // } else {
    //   history.push(
    //     formatPath(Paths.applicationsReview, {
    //       applicationId: application.id,
    //     })
    //   );
    // }
  };

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
                        <Td isActionCell>
                          <ActionsColumn
                            items={[
                              {
                                title: t("actions.duplicate"),
                                onClick: () =>
                                  setArchetypeToDuplicate(archetype),
                              },
                              {
                                title: t("actions.assess"),
                                onClick: () =>
                                  assessSelectedArchetype(archetype),
                              },
                              {
                                title: t("actions.edit"),
                                onClick: () => setArchetypeToEdit(archetype),
                              },
                              { isSeparator: true },
                              {
                                title: t("actions.delete"),
                                onClick: () => setArchetypeToDelete(archetype),
                                isDanger: true,
                              },
                            ]}
                          />
                        </Td>
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

      {/* Create modal */}
      <Modal
        title={t("dialog.title.newArchetype")}
        variant="medium"
        isOpen={openCreateArchetype}
        onClose={() => setOpenCreateArchetype(false)}
      >
        <ArchetypeForm onClose={() => setOpenCreateArchetype(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal
        title={t("dialog.title.updateArchetype")}
        variant="medium"
        isOpen={!!archetypeToEdit}
        onClose={() => setArchetypeToEdit(null)}
      >
        <ArchetypeForm
          key={archetypeToEdit?.id ?? -1}
          archetype={archetypeToEdit}
          onClose={() => setArchetypeToEdit(null)}
        />
      </Modal>

      {/* Duplicate modal */}
      <Modal
        title={t("dialog.title.newArchetype")}
        variant="medium"
        isOpen={!!archetypeToDuplicate}
        onClose={() => setArchetypeToDuplicate(null)}
      >
        <ArchetypeForm
          key={archetypeToDuplicate?.id ?? -1}
          archetype={archetypeToDuplicate}
          isDuplicating
          onClose={() => setArchetypeToDuplicate(null)}
        />
      </Modal>

      {/* TODO: Add duplicate confirm modal */}

      {/* Delete confirm modal */}
      <ConfirmDialog
        title={t("dialog.title.deleteWithName", {
          what: t("terms.archetype").toLowerCase(),
          name: archetypeToDelete?.name,
        })}
        isOpen={!!archetypeToDelete}
        titleIconVariant="warning"
        message={t("dialog.message.delete")}
        confirmBtnVariant={ButtonVariant.danger}
        confirmBtnLabel={t("actions.delete")}
        cancelBtnLabel={t("actions.cancel")}
        onCancel={() => setArchetypeToDelete(null)}
        onClose={() => setArchetypeToDelete(null)}
        onConfirm={() => {
          if (archetypeToDelete) {
            deleteArchetype(archetypeToDelete);
            setArchetypeToDelete(null);
          }
        }}
      />
      <ConfirmDialog
        title={t("dialog.title.newAssessment")}
        titleIconVariant={"warning"}
        isOpen={isOverrideModalOpen}
        message={t("message.overrideArchetypeConfirmation")}
        confirmBtnVariant={ButtonVariant.primary}
        confirmBtnLabel={t("actions.accept")}
        cancelBtnLabel={t("actions.cancel")}
        onCancel={() => setArchetypeToAssess(null)}
        onClose={() => setArchetypeToAssess(null)}
        onConfirm={() => {
          archetypeToAssess &&
            history.push(
              formatPath(Paths.archetypeAssessmentActions, {
                archetypeId: archetypeToAssess?.id,
              })
            );
          setArchetypeToAssess(null);
        }}
      />
    </>
  );
};

export default Archetypes;
