import React, { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
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
import {
  deserializeFilterUrlParams,
  useLocalTableControls,
} from "@app/hooks/table-controls";
import {
  useDeleteArchetypeMutation,
  useFetchArchetypes,
} from "@app/queries/archetypes";

import ArchetypeApplicationsColumn from "./components/archetype-applications-column";
import ArchetypeDescriptionColumn from "./components/archetype-description-column";
import ArchetypeDetailDrawer from "./components/archetype-detail-drawer";
import ArchetypeForm from "./components/archetype-form";
import ArchetypeMaintainersColumn from "./components/archetype-maintainers-column";
import ArchetypeTagsColumn from "./components/archetype-tags-column";
import { Archetype } from "@app/api/models";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { formatPath, getAxiosErrorMessage } from "@app/utils/utils";
import { AxiosError } from "axios";
import { Paths } from "@app/Paths";
import { SimplePagination } from "@app/components/SimplePagination";
import { TablePersistenceKeyPrefix } from "@app/Constants";
import { useDeleteAssessmentMutation } from "@app/queries/assessments";
import { useDeleteReviewMutation } from "@app/queries/reviews";
import {
  assessmentWriteScopes,
  reviewsWriteScopes,
  archetypesWriteScopes,
} from "@app/rbac";
import { checkAccess } from "@app/utils/rbac-utils";
import keycloak from "@app/keycloak";

const Archetypes: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { pushNotification } = React.useContext(NotificationsContext);

  const [openCreateArchetype, setOpenCreateArchetype] =
    useState<boolean>(false);

  const [reviewToEdit, setReviewToEdit] = React.useState<number | null>(null);

  const [archetypeToEdit, setArchetypeToEdit] = useState<Archetype | null>(
    null
  );
  const [assessmentToDiscard, setAssessmentToDiscard] =
    React.useState<Archetype | null>(null);

  const [reviewToDiscard, setReviewToDiscard] =
    React.useState<Archetype | null>(null);

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

  const { mutate: deleteAssessment } = useDeleteAssessmentMutation();

  const discardAssessment = async (archetype: Archetype) => {
    try {
      if (archetype.assessments) {
        await Promise.all(
          archetype.assessments.map(async (assessment) => {
            await deleteAssessment({
              assessmentId: assessment.id,
              archetypeId: archetype.id,
            });
          })
        ).then(() => {
          pushNotification({
            title: t("toastr.success.assessmentDiscarded", {
              application: archetype.name,
            }),
            variant: "success",
          });
        });
      }
    } catch (error) {
      console.error("Error while deleting assessments:", error);
      pushNotification({
        title: getAxiosErrorMessage(error as AxiosError),
        variant: "danger",
      });
    }
  };

  const onDeleteReviewSuccess = (name: string) => {
    pushNotification({
      title: t("toastr.success.reviewDiscarded", {
        application: name,
      }),
      variant: "success",
    });
  };

  const { mutate: deleteReview } = useDeleteReviewMutation(
    onDeleteReviewSuccess
  );

  const discardReview = async (archetype: Archetype) => {
    try {
      if (archetype.review?.id) {
        await deleteReview({
          id: archetype.review.id,
          name: archetype.name,
        });
      }
    } catch (error) {
      console.error("Error while deleting review:", error);
      pushNotification({
        title: getAxiosErrorMessage(error as AxiosError),
        variant: "danger",
      });
    }
  };
  const urlParams = new URLSearchParams(window.location.search);
  const filters = urlParams.get("filters");

  const deserializedFilterValues = deserializeFilterUrlParams({ filters });

  const tableControls = useLocalTableControls({
    persistTo: "urlParams",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.archetypes,
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

    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isActiveItemEnabled: true,

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
      {
        key: "application.name",
        title: t("terms.applicationName"),
        type: FilterType.multiselect,
        logicOperator: "OR",
        selectOptions: [
          ...new Set(
            archetypes.flatMap(
              (archetype) =>
                archetype?.applications
                  ?.map((app) => app.name)
                  .filter(Boolean) || []
            )
          ),
        ].map((applicationName) => ({
          key: applicationName,
          value: applicationName,
        })),
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.application").toLowerCase(),
          }) + "...",
        getItemValue: (archetype) => {
          const appNames = archetype.applications
            ?.map((app) => app.name)
            .join("");
          return appNames || "";
        },
      },

      // TODO: Add filter for archetype tags
    ],

    sortableColumns: ["name"],
    initialFilterValues: deserializedFilterValues,
    getSortValues: (archetype) => ({
      name: archetype.name ?? "",
    }),
    initialSort: { columnKey: "name", direction: "asc" },
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
      getTrProps,
      getTdProps,
    },
    activeItemDerivedState: { activeItem, clearActiveItem },
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
    if (archetype.review) {
      setReviewToEdit(archetype.id);
    } else {
      history.push(
        formatPath(Paths.archetypeReview, {
          archetypeId: archetype.id,
        })
      );
    }
  };

  const token = keycloak.tokenParsed;
  const userScopes: string[] = token?.scope.split(" ") || [],
    archetypeWriteAccess = checkAccess(userScopes, archetypesWriteScopes),
    assessmentWriteAccess = checkAccess(userScopes, assessmentWriteScopes),
    reviewsWriteAccess = checkAccess(userScopes, reviewsWriteScopes);

  const clearFilters = () => {
    const currentPath = history.location.pathname;
    const newSearch = new URLSearchParams(history.location.search);
    newSearch.delete("filters");
    history.push(`${currentPath}`);
    filterToolbarProps.setFilterValues({});
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
            <Toolbar {...toolbarProps} clearAllFilters={clearFilters}>
              <ToolbarContent>
                <FilterToolbar {...filterToolbarProps} />
                <ToolbarGroup variant="button-group">
                  <ToolbarItem>
                    {archetypeWriteAccess && <CreateButton />}
                  </ToolbarItem>
                </ToolbarGroup>
                <ToolbarItem {...paginationToolbarItemProps}>
                  <SimplePagination
                    idPrefix="archetypes-table"
                    isTop
                    paginationProps={paginationProps}
                  />
                </ToolbarItem>
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
                  </EmptyState>
                }
                numRenderedColumns={numRenderedColumns}
              >
                <Tbody>
                  {currentPageItems?.map((archetype, rowIndex) => (
                    <Tr key={archetype.id} {...getTrProps({ item: archetype })}>
                      <TableRowContentWithControls
                        {...tableControls}
                        item={archetype}
                        rowIndex={rowIndex}
                      >
                        <Td {...getTdProps({ columnKey: "name" })}>
                          {archetype.name}
                        </Td>
                        <Td
                          {...getTdProps({ columnKey: "description" })}
                          modifier="truncate"
                        >
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
                          {(archetypeWriteAccess ||
                            assessmentWriteAccess ||
                            reviewsWriteAccess ||
                            (archetype?.assessments?.length &&
                              assessmentWriteAccess) ||
                            (archetype?.review && reviewsWriteAccess)) && (
                            <ActionsColumn
                              items={[
                                ...(archetypeWriteAccess
                                  ? [
                                      {
                                        title: t("actions.duplicate"),
                                        onClick: () =>
                                          setArchetypeToDuplicate(archetype),
                                      },
                                    ]
                                  : []),
                                ...(assessmentWriteAccess
                                  ? [
                                      {
                                        title: t("actions.assess"),
                                        onClick: () =>
                                          assessSelectedArchetype(archetype),
                                      },
                                    ]
                                  : []),
                                ...(reviewsWriteAccess
                                  ? [
                                      {
                                        title: t("actions.review"),
                                        onClick: () =>
                                          reviewSelectedArchetype(archetype),
                                      },
                                    ]
                                  : []),
                                ...(archetypeWriteAccess
                                  ? [
                                      {
                                        title: t("actions.edit"),
                                        onClick: () =>
                                          setArchetypeToEdit(archetype),
                                      },
                                    ]
                                  : []),
                                ...(archetype?.assessments?.length &&
                                assessmentWriteAccess
                                  ? [
                                      {
                                        title: t("actions.discardAssessment"),
                                        onClick: () =>
                                          setAssessmentToDiscard(archetype),
                                      },
                                    ]
                                  : []),
                                ...(archetype?.review && reviewsWriteAccess
                                  ? [
                                      {
                                        title: t("actions.discardReview"),
                                        onClick: () =>
                                          setReviewToDiscard(archetype),
                                      },
                                    ]
                                  : []),
                                { isSeparator: true },
                                ...(archetypeWriteAccess
                                  ? [
                                      {
                                        title: t("actions.delete"),
                                        onClick: () =>
                                          setArchetypeToDelete(archetype),
                                        isDanger: true,
                                      },
                                    ]
                                  : []),
                              ]}
                            />
                          )}
                        </Td>
                      </TableRowContentWithControls>
                    </Tr>
                  ))}
                </Tbody>
              </ConditionalTableBody>
            </Table>
            <SimplePagination
              idPrefix="archetypes-table"
              isTop={false}
              paginationProps={paginationProps}
            />
          </div>
        </ConditionalRender>
      </PageSection>

      <ArchetypeDetailDrawer
        archetype={activeItem}
        onCloseClick={clearActiveItem}
      />

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
      <ConfirmDialog
        title={t("dialog.title.discard", {
          what: t("terms.assessment").toLowerCase(),
        })}
        titleIconVariant={"warning"}
        isOpen={assessmentToDiscard !== null}
        message={
          <span>
            <Trans
              i18nKey="dialog.message.discardAssessment"
              values={{
                applicationName: assessmentToDiscard?.name,
              }}
            >
              The assessment(s) for <strong>{assessmentToDiscard?.name}</strong>{" "}
              will be discarded. Do you wish to continue?
            </Trans>
          </span>
        }
        confirmBtnVariant={ButtonVariant.primary}
        confirmBtnLabel={t("actions.continue")}
        cancelBtnLabel={t("actions.cancel")}
        onCancel={() => setAssessmentToDiscard(null)}
        onClose={() => setAssessmentToDiscard(null)}
        onConfirm={() => {
          discardAssessment(assessmentToDiscard!);
          setAssessmentToDiscard(null);
        }}
      />
      <ConfirmDialog
        title={t("dialog.title.discard", {
          what: t("terms.review").toLowerCase(),
        })}
        titleIconVariant={"warning"}
        isOpen={reviewToDiscard !== null}
        message={
          <span>
            <Trans
              i18nKey="dialog.message.discardReview"
              values={{
                applicationName: reviewToDiscard?.name,
              }}
            >
              The review for <strong>{reviewToDiscard?.name}</strong> will be
              discarded, as well as the review result. Do you wish to continue?
            </Trans>
          </span>
        }
        confirmBtnVariant={ButtonVariant.primary}
        confirmBtnLabel={t("actions.continue")}
        cancelBtnLabel={t("actions.cancel")}
        onCancel={() => setReviewToDiscard(null)}
        onClose={() => setReviewToDiscard(null)}
        onConfirm={() => {
          discardReview(reviewToDiscard!);
          setReviewToDiscard(null);
        }}
      />

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

      {/* Override existing assessment confirm modal */}
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
      <ConfirmDialog
        title={t("composed.editQuestion", {
          what: t("terms.review").toLowerCase(),
        })}
        titleIconVariant={"warning"}
        isOpen={reviewToEdit !== null}
        message={t("message.editArchetypeReviewConfirmation")}
        confirmBtnVariant={ButtonVariant.primary}
        confirmBtnLabel={t("actions.continue")}
        cancelBtnLabel={t("actions.cancel")}
        onCancel={() => setReviewToEdit(null)}
        onClose={() => setReviewToEdit(null)}
        onConfirm={() => {
          history.push(
            formatPath(Paths.archetypeReview, {
              archetypeId: reviewToEdit,
            })
          );
          setReviewToEdit(null);
        }}
      />
    </>
  );
};

export default Archetypes;
