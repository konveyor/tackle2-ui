import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  Dropdown,
  DropdownItem,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  MenuToggle,
  MenuToggleElement,
  Modal,
  ModalVariant,
  PageSection,
  PageSectionVariants,
  Switch,
  Text,
  TextContent,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { AxiosError } from "axios";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { LockIcon, EllipsisVIcon, CubesIcon } from "@patternfly/react-icons";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import {
  useDeleteQuestionnaireMutation,
  useFetchQuestionnaires,
  useUpdateQuestionnaireMutation,
} from "@app/queries/questionnaires";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { ConditionalTooltip } from "@app/components/ConditionalTooltip";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { Questionnaire } from "@app/api/models";
import { useHistory } from "react-router-dom";
import { Paths } from "@app/Paths";
import { ImportQuestionnaireForm } from "@app/pages/assessment/import-questionnaire-form/import-questionnaire-form";

const AssessmentSettings: React.FC = () => {
  const { t } = useTranslation();

  const history = useHistory();
  const { pushNotification } = React.useContext(NotificationsContext);

  const { questionnaires, isFetching, fetchError } = useFetchQuestionnaires();

  const onSaveQuestionnaireSuccess = () => {};

  const onSaveQuestionnaireError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: updateQuestionnaire } = useUpdateQuestionnaireMutation(
    onSaveQuestionnaireSuccess,
    onSaveQuestionnaireError
  );

  const onDeleteQuestionnaireSuccess = (name: string) => {
    pushNotification({
      title: t("toastr.success.deletedWhat", {
        what: name,
        type: t("terms.questionnaire"),
      }),
      variant: "success",
    });
  };

  const { mutate: deleteQuestionnaire } = useDeleteQuestionnaireMutation(
    onDeleteQuestionnaireSuccess,
    onSaveQuestionnaireError
  );

  const [isImportModal, setIsImportModal] = React.useState<boolean>(false);
  const [isDownloadTemplateModal, setIsDownloadTemplateModal] =
    React.useState<boolean>(false);

  const [isKebabOpen, setIsKebabOpen] = React.useState<number | null>(null);
  const [questionnaireToExport, setQuestionnaireToExport] = React.useState<
    number | null
  >(null);
  const [questionnaireToDelete, setQuestionnaireToDelete] =
    React.useState<Questionnaire | null>();

  const tableControls = useLocalTableControls({
    idProperty: "id",
    items: questionnaires,
    columnNames: {
      required: "Required",
      name: "Name",
      questions: "Questions",
      rating: "Rating",
      dateImported: "Date imported",
    },
    isSelectable: false,
    expandableVariant: null,
    hasActionsColumn: true,
    filterCategories: [
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
    ],
    sortableColumns: ["name", "dateImported"],
    getSortValues: (assessment) => ({
      name: assessment.name || "",
      dateImported: assessment.dateImported || "",
    }),
    initialSort: { columnKey: "name", direction: "asc" },
    hasPagination: true,
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
      getTdProps,
    },
  } = tableControls;

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.assessment")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isFetching && !(questionnaires || fetchError)}
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
                  {/* <RBAC
                        allowedPermissions={[]}
                        rbacType={RBAC_TYPE.Scope}
                      > */}
                  <ToolbarItem>
                    <Button
                      type="button"
                      id="import-questionnaire"
                      aria-label="Import questionnaire"
                      variant={ButtonVariant.primary}
                      onClick={() => setIsImportModal(true)}
                    >
                      {t("dialog.title.import", {
                        what: t("terms.questionnaire").toLowerCase(),
                      })}
                    </Button>
                  </ToolbarItem>
                  {/* </RBAC> */}
                  {
                    //RBAC
                    // xxxxWriteAccess = checkAccess(userScopes, questionnaireWriteScopes);
                    true ? ( //TODO: Check RBAC access
                      <ToolbarItem>
                        <Button
                          type="button"
                          id="download-yaml-template"
                          aria-label="Download questionnaire"
                          variant={ButtonVariant.link}
                          onClick={() => setIsDownloadTemplateModal(true)}
                        >
                          {t("dialog.title.download", {
                            what: t("terms.YAMLTemplate"),
                          })}
                        </Button>
                      </ToolbarItem>
                    ) : null
                  }
                </ToolbarGroup>
                <ToolbarItem {...paginationToolbarItemProps}>
                  <SimplePagination
                    idPrefix="questionnaire-table"
                    isTop
                    paginationProps={paginationProps}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>
            <Table {...tableProps} aria-label="Questionnaires table">
              <Thead>
                <Tr>
                  <TableHeaderContentWithControls {...tableControls}>
                    <Th {...getThProps({ columnKey: "required" })} />
                    <Th {...getThProps({ columnKey: "name" })} />
                    <Th {...getThProps({ columnKey: "questions" })} />
                    <Th {...getThProps({ columnKey: "rating" })} />
                    <Th {...getThProps({ columnKey: "dateImported" })} />
                  </TableHeaderContentWithControls>
                </Tr>
              </Thead>
              <ConditionalTableBody
                isLoading={isFetching}
                isError={!!fetchError}
                isNoData={currentPageItems.length === 0}
                noDataEmptyState={
                  <EmptyState variant="sm">
                    <EmptyStateIcon icon={CubesIcon} />
                    <Title headingLevel="h2" size="lg">
                      No questionnaire available
                    </Title>
                    <EmptyStateBody>
                      Use the import button above to add your questionnaire.
                    </EmptyStateBody>
                  </EmptyState>
                }
                numRenderedColumns={numRenderedColumns}
              >
                {currentPageItems?.map((questionnaire, rowIndex) => {
                  return (
                    <Tbody key={questionnaire.id}>
                      <Tr>
                        <TableRowContentWithControls
                          {...tableControls}
                          item={questionnaire}
                          rowIndex={rowIndex}
                        >
                          <Td
                            width={10}
                            {...getTdProps({ columnKey: "required" })}
                          >
                            {questionnaire.required}
                            <Switch
                              id={`required-switch-${rowIndex.toString()}`}
                              label="Yes"
                              labelOff="No"
                              isChecked={questionnaire.required}
                              onChange={() => {
                                updateQuestionnaire({
                                  ...questionnaire,
                                  required: !questionnaire.required,
                                });
                              }}
                            />
                          </Td>
                          <Td width={25} {...getTdProps({ columnKey: "name" })}>
                            {questionnaire.system && (
                              <LockIcon className={spacing.mrSm} />
                            )}
                            {questionnaire.name}
                          </Td>
                          <Td
                            width={10}
                            {...getTdProps({ columnKey: "questions" })}
                          >
                            {questionnaire.questions}
                          </Td>
                          <Td
                            width={15}
                            {...getTdProps({ columnKey: "rating" })}
                          >
                            {questionnaire.rating}
                          </Td>
                          <Td
                            width={25}
                            {...getTdProps({ columnKey: "dateImported" })}
                          >
                            {questionnaire.dateImported}
                          </Td>
                          <Td width={10}>
                            <Dropdown
                              isOpen={isKebabOpen === questionnaire.id}
                              onSelect={() => setIsKebabOpen(null)}
                              onOpenChange={(_isOpen) => setIsKebabOpen(null)}
                              toggle={(
                                toggleRef: React.Ref<MenuToggleElement>
                              ) => (
                                <MenuToggle
                                  ref={toggleRef}
                                  aria-label="kebab dropdown toggle"
                                  variant="plain"
                                  onClick={() => {
                                    isKebabOpen
                                      ? setIsKebabOpen(null)
                                      : setIsKebabOpen(questionnaire.id);
                                  }}
                                  isExpanded={isKebabOpen === rowIndex}
                                >
                                  <EllipsisVIcon />
                                </MenuToggle>
                              )}
                              shouldFocusToggleOnSelect
                            >
                              <DropdownItem
                                key="export"
                                component="button"
                                onClick={() =>
                                  setQuestionnaireToExport(questionnaire.id)
                                }
                              >
                                {t("actions.export")}
                              </DropdownItem>
                              <DropdownItem
                                key="view"
                                component="button"
                                onClick={() => {
                                  history.push(Paths.questionnaire);
                                }}
                              >
                                {t("actions.view")}
                              </DropdownItem>
                              <ConditionalTooltip
                                key="system-questionnaire"
                                isTooltipEnabled={questionnaire.system}
                                content={
                                  "Disabled because it is a system questionnaire."
                                }
                              >
                                <DropdownItem
                                  key="delete"
                                  isAriaDisabled={questionnaire.system === true}
                                  onClick={() =>
                                    setQuestionnaireToDelete(questionnaire)
                                  }
                                >
                                  {t("actions.delete")}
                                </DropdownItem>
                              </ConditionalTooltip>
                            </Dropdown>
                          </Td>
                        </TableRowContentWithControls>
                      </Tr>
                    </Tbody>
                  );
                })}
              </ConditionalTableBody>
            </Table>
            <SimplePagination
              idPrefix="questionnaires-table"
              isTop={false}
              paginationProps={paginationProps}
            />
          </div>
        </ConditionalRender>
      </PageSection>
      <Modal
        id="import.modal"
        title={t("dialog.title.import", {
          what: t("terms.questionnaire").toLowerCase(),
        })}
        variant={ModalVariant.medium}
        isOpen={isImportModal}
        onClose={() => setIsImportModal(false)}
      >
        <ImportQuestionnaireForm onSaved={() => setIsImportModal(false)} />
      </Modal>
      <Modal
        id="download.template.modal"
        title={t("dialog.title.download", {
          what: t("terms.YAMLTemplate"),
        })}
        variant={ModalVariant.medium}
        isOpen={isDownloadTemplateModal}
        onClose={() => setIsDownloadTemplateModal(false)}
      >
        <Text>TODO Downlaod YAML Template component</Text>
      </Modal>
      <Modal
        id="export.modal"
        title={t("dialog.title.export", {
          what: t("terms.questionnaire").toLowerCase(),
        })}
        variant={ModalVariant.medium}
        isOpen={!!questionnaireToExport}
        onClose={() => setQuestionnaireToExport(null)}
      >
        <Text>TODO Export questionnaire Id {questionnaireToExport}</Text>
      </Modal>{" "}
      <Modal
        id="download.template.modal"
        title={t("dialog.title.download", {
          what: t("terms.YAMLTemplate"),
        })}
        variant={ModalVariant.medium}
        isOpen={isDownloadTemplateModal}
        onClose={() => setIsDownloadTemplateModal(false)}
      >
        <Text>TODO Downlaod YAML Template component</Text>
      </Modal>
      <ConfirmDialog
        title={t("dialog.title.delete", {
          what: t("terms.questionnaire").toLowerCase(),
        })}
        isOpen={!!questionnaireToDelete}
        titleIconVariant={"warning"}
        message={t("dialog.message.delete")}
        confirmBtnVariant={ButtonVariant.danger}
        confirmBtnLabel={t("actions.delete")}
        cancelBtnLabel={t("actions.cancel")}
        onCancel={() => setQuestionnaireToDelete(null)}
        onClose={() => setQuestionnaireToDelete(null)}
        onConfirm={() => {
          if (questionnaireToDelete) {
            deleteQuestionnaire({ questionnaire: questionnaireToDelete });
            setQuestionnaireToDelete(null);
          }
        }}
      />
    </>
  );
};
export default AssessmentSettings;
