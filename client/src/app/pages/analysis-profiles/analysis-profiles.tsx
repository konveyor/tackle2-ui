import * as React from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateActions,
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
  Tooltip,
} from "@patternfly/react-core";
import { CubesIcon, PencilAltIcon } from "@patternfly/react-icons";
import {
  ActionsColumn,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";

import { AnalysisProfile, Archetype } from "@app/api/models";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";
import {
  useDeleteAnalysisProfileMutation,
  useFetchAnalysisProfiles,
} from "@app/queries/analysis-profiles";
import { useFetchArchetypes } from "@app/queries/archetypes";
import { getAxiosErrorMessage } from "@app/utils/utils";

import AnalysisProfileDetailDrawer from "./components/analysis-profile-detail-drawer";
import { AnalysisProfileWizard } from "./profile-wizard/analysis-profile-wizard";

/**
 * Hook to find archetypes that reference a given analysis profile
 * via their target profiles.
 */
const useArchetypesUsingAnalysisProfile = (
  analysisProfile: AnalysisProfile | null
): Archetype[] => {
  const { archetypes } = useFetchArchetypes();

  return React.useMemo(() => {
    if (!analysisProfile) return [];
    return archetypes.filter((archetype) =>
      archetype.profiles?.some(
        (targetProfile) =>
          targetProfile.analysisProfile?.id === analysisProfile.id
      )
    );
  }, [archetypes, analysisProfile]);
};

export const AnalysisProfiles: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const [openCreateProfile, setOpenCreateProfile] =
    React.useState<boolean>(false);
  const [profileToEdit, setProfileToEdit] =
    React.useState<AnalysisProfile | null>(null);
  const [profileToDelete, setProfileToDelete] =
    React.useState<AnalysisProfile | null>(null);

  const { analysisProfiles, isFetching, error } = useFetchAnalysisProfiles();
  const archetypesUsingProfileToDelete =
    useArchetypesUsingAnalysisProfile(profileToDelete);

  const onDeleteSuccess = (profile: AnalysisProfile) => {
    pushNotification({
      title: t("toastr.success.deletedWhat", {
        what: profile.name,
        type: t("terms.analysisProfile"),
      }),
      variant: "success",
    });
  };

  const onDeleteError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: deleteProfile } = useDeleteAnalysisProfileMutation(
    onDeleteSuccess,
    onDeleteError
  );

  const tableControls = useLocalTableControls({
    tableName: "analysis-profiles",
    idProperty: "id",
    dataNameProperty: "name",
    items: analysisProfiles,
    columnNames: {
      name: t("terms.name"),
      description: t("terms.description"),
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isActiveItemEnabled: true,
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
        getItemValue: (profile: AnalysisProfile) => profile?.name ?? "",
      },
    ],
    sortableColumns: ["name", "description"],
    getSortValues: (profile: AnalysisProfile) => ({
      name: profile.name ?? "",
      description: profile.description ?? "",
    }),
    initialSort: { columnKey: "name", direction: "asc" },
    isLoading: isFetching,
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

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("titles.analysisProfiles")}</Text>
        </TextContent>
        <TextContent>
          <Text>{t("terms.analysisProfilesDescription")}</Text>
        </TextContent>
      </PageSection>

      <PageSection>
        <div
          style={{
            backgroundColor: "var(--pf-v5-global--BackgroundColor--100)",
          }}
        >
          <Toolbar
            {...toolbarProps}
            clearAllFilters={() => filterToolbarProps.setFilterValues({})}
          >
            <ToolbarContent>
              <FilterToolbar {...filterToolbarProps} />
              <ToolbarGroup variant="button-group">
                <ToolbarItem>
                  <Button
                    id="create-analysis-profile"
                    variant="primary"
                    onClick={() => {
                      setOpenCreateProfile(true);
                    }}
                  >
                    {t("actions.createNew")}
                  </Button>
                </ToolbarItem>
              </ToolbarGroup>
              <ToolbarItem {...paginationToolbarItemProps}>
                <SimplePagination
                  idPrefix="analysis-profiles-table"
                  isTop
                  paginationProps={paginationProps}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          <Table
            {...tableProps}
            id="analysis-profiles-table"
            aria-label={t("titles.analysisProfiles")}
          >
            <Thead>
              <Tr>
                <TableHeaderContentWithControls {...tableControls}>
                  <Th {...getThProps({ columnKey: "name" })} />
                  <Th {...getThProps({ columnKey: "description" })} />
                </TableHeaderContentWithControls>
              </Tr>
            </Thead>
            <ConditionalTableBody
              isLoading={isFetching}
              isError={!!error}
              isNoData={currentPageItems.length === 0}
              noDataEmptyState={
                <EmptyState variant="sm">
                  <EmptyStateHeader
                    titleText={t("composed.noDataStateTitle", {
                      what: t("terms.analysisProfiles").toLowerCase(),
                    })}
                    headingLevel="h2"
                    icon={<EmptyStateIcon icon={CubesIcon} />}
                  />
                  <EmptyStateBody>
                    {t("composed.noDataStateBody", {
                      how: t("actions.create"),
                      what: t("terms.analysisProfile").toLowerCase(),
                    })}
                  </EmptyStateBody>
                  <EmptyStateFooter>
                    <EmptyStateActions>
                      <Button
                        variant="primary"
                        onClick={() => {
                          setOpenCreateProfile(true);
                        }}
                      >
                        {t("actions.createNew")}
                      </Button>
                    </EmptyStateActions>
                  </EmptyStateFooter>
                </EmptyState>
              }
              numRenderedColumns={numRenderedColumns}
            >
              <Tbody>
                {currentPageItems.map((profile, rowIndex) => (
                  <Tr key={profile.id} {...getTrProps({ item: profile })}>
                    <TableRowContentWithControls
                      {...tableControls}
                      item={profile}
                      rowIndex={rowIndex}
                    >
                      <Td width={25} {...getTdProps({ columnKey: "name" })}>
                        {profile.name}
                      </Td>
                      <Td
                        width={50}
                        {...getTdProps({ columnKey: "description" })}
                      >
                        {profile.description || "-"}
                      </Td>
                      <Td isActionCell id={`pencil-action-${profile.id}`}>
                        <Tooltip content={t("actions.edit")}>
                          <Button
                            variant="plain"
                            icon={<PencilAltIcon />}
                            onClick={() => setProfileToEdit(profile)}
                          />
                        </Tooltip>
                      </Td>
                      <Td isActionCell id={`row-actions-${profile.id}`}>
                        <ActionsColumn
                          items={[
                            {
                              title: t("actions.delete"),
                              onClick: () => setProfileToDelete(profile),
                              isDanger: true,
                            },
                          ]}
                        />
                      </Td>
                    </TableRowContentWithControls>
                  </Tr>
                ))}
              </Tbody>
            </ConditionalTableBody>
          </Table>
          <SimplePagination
            idPrefix="analysis-profiles-table"
            isTop={false}
            paginationProps={paginationProps}
          />
        </div>
      </PageSection>

      {/* Detail drawer */}
      <AnalysisProfileDetailDrawer
        analysisProfile={activeItem}
        onCloseClick={clearActiveItem}
      />

      {/* Confirm delete analysis profile modal */}
      <ConfirmDialog
        title={t("dialog.title.deleteWithName", {
          what: t("terms.analysisProfile").toLowerCase(),
          name: profileToDelete?.name,
        })}
        isOpen={!!profileToDelete}
        titleIconVariant={
          archetypesUsingProfileToDelete.length > 0 ? "danger" : "warning"
        }
        message={
          archetypesUsingProfileToDelete.length > 0
            ? t("message.analysisProfileInUseWarning", {
                count: archetypesUsingProfileToDelete.length,
                archetypes: archetypesUsingProfileToDelete
                  .map((a) => a.name)
                  .join(", "),
              })
            : t("dialog.message.delete")
        }
        confirmBtnVariant={ButtonVariant.danger}
        confirmBtnLabel={t("actions.delete")}
        cancelBtnLabel={t("actions.cancel")}
        onCancel={() => setProfileToDelete(null)}
        onClose={() => setProfileToDelete(null)}
        onConfirm={() => {
          if (profileToDelete) {
            deleteProfile(profileToDelete);
            setProfileToDelete(null);
          }
        }}
      />

      {/* Edit a profile */}
      <AnalysisProfileWizard
        key={profileToEdit?.id ?? -1}
        analysisProfile={profileToEdit}
        isOpen={!!profileToEdit}
        onClose={() => setProfileToEdit(null)}
      />

      {/* Create a profile */}
      <AnalysisProfileWizard
        key={openCreateProfile ? "opened" : "closed"}
        analysisProfile={null}
        isOpen={openCreateProfile}
        onClose={() => setOpenCreateProfile(false)}
      />
    </>
  );
};
