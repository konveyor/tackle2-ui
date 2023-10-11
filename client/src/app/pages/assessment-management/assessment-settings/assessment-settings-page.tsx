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
  List,
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
import { useLocalTableControls } from "@app/hooks/table-controls";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { formatPath, getAxiosErrorMessage } from "@app/utils/utils";
import { Questionnaire } from "@app/api/models";
import { useHistory } from "react-router-dom";
import { Paths } from "@app/Paths";
import { ImportQuestionnaireForm } from "@app/pages/assessment-management/import-questionnaire-form/import-questionnaire-form";
import ConfirmDeleteDialog from "@app/components/ConfirmDeleteDialog/ConfirmDeleteDialog";
import { ExportQuestionnaireDropdownItem } from "./components/export-questionnaire-dropdown-item";
import dayjs from "dayjs";
import { QuestionnaireQuestionsColumn } from "./components/questionnaire-questions-column";
import { QuestionnaireThresholdsColumn } from "./components/questionnaire-thresholds-column";
import saveAs from "file-saver";
import { load } from "js-yaml";
import questionnaireTemplateFile from "./questionnaire-template.yaml";

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

  const [isKebabOpen, setIsKebabOpen] = React.useState<number | null>(null);

  const [questionnaireToDelete, setQuestionnaireToDelete] =
    React.useState<Questionnaire>();
  const tableControls = useLocalTableControls({
    idProperty: "id",
    items: questionnaires || [],
    columnNames: {
      required: "Required",
      name: "Name",
      questions: "Questions",
      rating: "Rating",
      createTime: "Date imported",
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
    sortableColumns: ["name", "createTime"],
    getSortValues: (questionnaire) => ({
      name: questionnaire.name || "",
      createTime: questionnaire.createTime || "",
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

  // TODO: Check RBAC access
  const rbacWriteAccess = true; // checkAccess(userScopes, questionnaireWriteScopes);

  const downloadTemplate = () => {
    const parsedContent = load(questionnaireTemplateFile);
    const blob = new Blob([JSON.stringify(parsedContent, null, 2)], {
      type: "application/x-yaml",
    });
    saveAs(blob, "questionnaire-template.yaml");
  };

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.assessmentQuestionnaires")}</Text>
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
                  {rbacWriteAccess ? (
                    <ToolbarItem>
                      <Button
                        type="button"
                        id="download-yaml-template"
                        aria-label="Download questionnaire"
                        variant={ButtonVariant.link}
                        onClick={downloadTemplate}
                      >
                        {t("dialog.title.download", {
                          what: t("terms.YAMLTemplate"),
                        })}
                      </Button>
                    </ToolbarItem>
                  ) : null}
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
                    <Th {...getThProps({ columnKey: "createTime" })} />
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
                  const formattedDate = dayjs(questionnaire.createTime)
                    .utc()
                    .format("YYYY-MM-DD HH:mm:ss");

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
                            {questionnaire.builtin && (
                              <LockIcon className={spacing.mrSm} />
                            )}
                            {questionnaire.name}
                          </Td>
                          <Td
                            width={10}
                            {...getTdProps({ columnKey: "questions" })}
                          >
                            <QuestionnaireQuestionsColumn
                              questionnaire={questionnaire}
                            />
                          </Td>
                          <Td
                            width={15}
                            {...getTdProps({ columnKey: "rating" })}
                          >
                            <List isPlain>
                              <QuestionnaireThresholdsColumn
                                questionnaire={questionnaire}
                              />
                            </List>
                          </Td>
                          <Td
                            width={25}
                            {...getTdProps({ columnKey: "createTime" })}
                          >
                            {formattedDate}
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
                              <ExportQuestionnaireDropdownItem
                                id={questionnaire.id}
                              />
                              <DropdownItem
                                key="view"
                                component="button"
                                onClick={() => {
                                  history.push(
                                    formatPath(Paths.questionnaire, {
                                      questionnaireId: questionnaire.id,
                                    })
                                  );
                                }}
                              >
                                {t("actions.view")}
                              </DropdownItem>
                              <ConditionalTooltip
                                key="system-questionnaire"
                                isTooltipEnabled={
                                  questionnaire.builtin === true
                                }
                                content={
                                  "Disabled because it is a system questionnaire."
                                }
                              >
                                <DropdownItem
                                  key="delete"
                                  isAriaDisabled={
                                    questionnaire.builtin === true
                                  }
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
      <ConfirmDeleteDialog
        deleteObjectMessage={t("dialog.message.deleteQuestionnaire")}
        isOpen={!!questionnaireToDelete}
        nameToDelete={questionnaireToDelete?.name}
        onClose={() => setQuestionnaireToDelete(undefined)}
        onConfirmDelete={() => {
          questionnaireToDelete &&
            deleteQuestionnaire({ questionnaire: questionnaireToDelete });
          setQuestionnaireToDelete(undefined);
        }}
        titleWhat={t("terms.questionnaire").toLowerCase()}
      />
    </>
  );
};
export default AssessmentSettings;
