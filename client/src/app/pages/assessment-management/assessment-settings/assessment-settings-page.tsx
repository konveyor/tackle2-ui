import * as React from "react";
import { AxiosError } from "axios";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import {
  Button,
  ButtonVariant,
  Content,
  EmptyState,
  EmptyStateBody,
  List,
  PageSection,
  Switch,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { Modal, ModalVariant } from "@patternfly/react-core/deprecated";
import { CubesIcon, LockIcon } from "@patternfly/react-icons";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import {
  ActionsColumn,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";

import { Paths } from "@app/Paths";
import { Questionnaire } from "@app/api/models";
import { useHasSomeScopes } from "@app/auth";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import ConfirmDeleteDialog from "@app/components/ConfirmDeleteDialog/ConfirmDeleteDialog";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { ImportQuestionnaireForm } from "@app/pages/assessment-management/import-questionnaire-form/import-questionnaire-form";
import {
  useDeleteQuestionnaireMutation,
  useDownloadQuestionnaire,
  useFetchQuestionnaires,
  useUpdateQuestionnaireMutation,
} from "@app/queries/questionnaires";
import { questionnaireWriteScopes } from "@app/scopes";
import { formatPath, getAxiosErrorMessage } from "@app/utils/utils";

import { QuestionnaireQuestionsColumn } from "./components/questionnaire-questions-column";
import { QuestionnaireThresholdsColumn } from "./components/questionnaire-thresholds-column";

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

  const { mutate: downloadQuestionnaire } = useDownloadQuestionnaire();

  const [isImportModal, setIsImportModal] = React.useState<boolean>(false);

  const [questionnaireToDelete, setQuestionnaireToDelete] =
    React.useState<Questionnaire>();
  const tableControls = useLocalTableControls({
    tableName: "questionnaires-table",
    idProperty: "id",
    dataNameProperty: "name",
    items: questionnaires || [],
    columnNames: {
      required: "Required",
      name: "Name",
      questions: "Questions",
      rating: "Rating",
      createTime: "Date imported",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
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
  } = tableControls;

  const rbacWriteAccess = useHasSomeScopes(questionnaireWriteScopes);
  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">
            {t("terms.assessmentQuestionnaires")}
          </Content>
        </Content>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <ConditionalRender
          when={isFetching && !(questionnaires || fetchError)}
          then={<AppPlaceholder />}
        >
          <div
            style={{
              backgroundColor:
                "var(--pf-t--global--background--color--primary--default)",
            }}
          >
            <Toolbar {...toolbarProps}>
              <ToolbarContent>
                <FilterToolbar {...filterToolbarProps} />
                {rbacWriteAccess ? (
                  <ToolbarGroup variant="action-group">
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
                    <ToolbarItem>
                      <Button
                        type="button"
                        id="download-yaml-template"
                        aria-label="Download questionnaire"
                        variant={ButtonVariant.link}
                        component="a"
                        download
                        href="/templates/questionnaire-template.yaml"
                      >
                        {t("dialog.title.download", {
                          what: t("terms.YAMLTemplate"),
                        })}
                      </Button>
                    </ToolbarItem>
                  </ToolbarGroup>
                ) : null}
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
                    <Th screenReaderText={t("actions.rowActions")} />
                  </TableHeaderContentWithControls>
                </Tr>
              </Thead>
              <ConditionalTableBody
                isLoading={isFetching}
                isError={!!fetchError}
                isNoData={currentPageItems.length === 0}
                noDataEmptyState={
                  <EmptyState
                    headingLevel="h2"
                    icon={CubesIcon}
                    titleText={t("message.noQuestionnairesAvailable")}
                    variant="sm"
                  >
                    <EmptyStateBody>
                      {t("message.noQuestionnairesAvailableBody")}
                    </EmptyStateBody>
                  </EmptyState>
                }
                numRenderedColumns={numRenderedColumns}
              >
                <Tbody>
                  {currentPageItems?.map((questionnaire, rowIndex) => {
                    const formattedDate = dayjs(questionnaire.createTime)
                      .utc()
                      .format("YYYY-MM-DD HH:mm:ss");

                    return (
                      <Tr
                        key={questionnaire.id}
                        {...getTrProps({ item: questionnaire })}
                      >
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
                              id={`required-switch-${questionnaire.id}`}
                              label="Yes"
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
                          <Td isActionCell width={10}>
                            <ActionsColumn
                              items={[
                                {
                                  title: t("actions.export"),
                                  onClick: () =>
                                    downloadQuestionnaire(questionnaire.id),
                                },
                                {
                                  title: t("actions.view"),
                                  onClick: () => {
                                    history.push(
                                      formatPath(Paths.questionnaire, {
                                        questionnaireId: questionnaire.id,
                                      })
                                    );
                                  },
                                },
                                {
                                  title: t("actions.delete"),
                                  onClick: () =>
                                    setQuestionnaireToDelete(questionnaire),
                                  isDanger: true,
                                  isAriaDisabled:
                                    questionnaire.builtin === true,
                                  tooltipProps:
                                    questionnaire.builtin === true
                                      ? {
                                          content: t(
                                            "message.systemQuestionnaireDisabled"
                                          ),
                                        }
                                      : undefined,
                                },
                              ]}
                            />
                          </Td>
                        </TableRowContentWithControls>
                      </Tr>
                    );
                  })}
                </Tbody>
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
          if (questionnaireToDelete) {
            deleteQuestionnaire({ questionnaire: questionnaireToDelete });
          }
          setQuestionnaireToDelete(undefined);
        }}
        titleWhat={t("terms.questionnaire").toLowerCase()}
      />
    </>
  );
};
export default AssessmentSettings;
