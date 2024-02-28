import React from "react";
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ExpandableRowContent,
} from "@patternfly/react-table";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useTranslation } from "react-i18next";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { Assessment, Question, Questionnaire } from "@app/api/models";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { Label, List, ListItem, Tooltip } from "@patternfly/react-core";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import AnswerTable from "@app/components/answer-table/answer-table";
import { AxiosError } from "axios";

const QuestionsTable: React.FC<{
  fetchError: AxiosError | null;
  questions?: Question[];
  isSearching?: boolean;
  data?: Assessment | Questionnaire | null;
  isAllQuestionsTab?: boolean;
  hideAnswerKey?: boolean;
}> = ({
  fetchError,
  questions,
  isSearching = false,
  data,
  isAllQuestionsTab = false,
  hideAnswerKey,
}) => {
  const tableControls = useLocalTableControls({
    idProperty: "text",
    items: questions || [],
    columnNames: {
      formulation: "Name",
      section: "Section",
    },
    isExpansionEnabled: true,
    isPaginationEnabled: false,
    expandableVariant: "single",
    forceNumRenderedColumns: isAllQuestionsTab ? 3 : 2, // columns+1 for expand control
  });

  const {
    currentPageItems,
    numRenderedColumns,
    propHelpers: {
      tableProps,
      getThProps,
      getTrProps,
      getTdProps,
      getExpandedContentTdProps,
    },
    expansionDerivedState: { isCellExpanded },
  } = tableControls;

  const { t } = useTranslation();

  return (
    <Table {...tableProps} aria-label="Questions table">
      <Thead>
        <Tr>
          <TableHeaderContentWithControls {...tableControls}>
            <Th {...getThProps({ columnKey: "formulation" })} />
            {isAllQuestionsTab ? (
              <Th {...getThProps({ columnKey: "section" })} />
            ) : null}
          </TableHeaderContentWithControls>
        </Tr>
      </Thead>
      <ConditionalTableBody
        numRenderedColumns={numRenderedColumns}
        isError={!!fetchError}
        isNoData={questions?.length === 0}
        noDataEmptyState={
          <NoDataEmptyState
            title={
              isSearching
                ? isAllQuestionsTab
                  ? "No questions match your search"
                  : "No questions in this section match your search"
                : "This section is empty"
            }
          />
        }
      >
        <Tbody>
          {currentPageItems?.map((question, rowIndex) => {
            const sectionName =
              data?.sections.find((section) =>
                section.questions.includes(question)
              )?.name || "";

            const getConditionalTooltipContent = (question: Question) => {
              return (
                <div
                  className="pf-v5-c-tooltip__content pf-m-text-align-left"
                  id="conditional-tooltip-content"
                >
                  <div>{t("message.dependentQuestionTooltip")}</div>
                  {!!question.includeFor?.length && (
                    <>
                      <div>{t("terms.include")}:</div>
                      <List isPlain>
                        {question.includeFor.map((tag, index) => (
                          <ListItem key={index}>
                            <Label color="blue">
                              {tag.category} / {tag.tag}
                            </Label>
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                  {!!question.excludeFor?.length && (
                    <>
                      <div>{t("terms.exclude")}:</div>
                      <List isPlain>
                        {question.excludeFor.map((tag, index) => (
                          <ListItem key={index}>
                            <Label color="blue">
                              {tag.category} / {tag.tag}
                            </Label>
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </div>
              );
            };

            return (
              <React.Fragment key={rowIndex}>
                <Tr key={question.text} {...getTrProps({ item: question })}>
                  <TableRowContentWithControls
                    {...tableControls}
                    item={question}
                    rowIndex={rowIndex}
                  >
                    <Td
                      width={isAllQuestionsTab ? 60 : 100}
                      {...getTdProps({ columnKey: "formulation" })}
                    >
                      {(!!question?.includeFor?.length ||
                        !!question?.excludeFor?.length) && (
                        <Tooltip
                          content={getConditionalTooltipContent(question)}
                        >
                          <Label className={spacing.mrSm}>
                            {t("terms.dependentQuestion")}
                          </Label>
                        </Tooltip>
                      )}
                      {question.text}
                    </Td>
                    {isAllQuestionsTab ? (
                      <Td width={40} {...getTdProps({ columnKey: "section" })}>
                        {sectionName}
                      </Td>
                    ) : null}
                  </TableRowContentWithControls>
                </Tr>
                {isCellExpanded(question) ? (
                  <Tr isExpanded>
                    <Td />
                    <Td
                      {...getExpandedContentTdProps({ item: question })}
                      className={spacing.pyLg}
                    >
                      <ExpandableRowContent>
                        <div className={spacing.mlMd}>
                          <strong>{t("terms.explanation")}: &nbsp;</strong>
                          <span>{question.explanation}</span>
                          <AnswerTable
                            hideAnswerKey={hideAnswerKey}
                            answers={question.answers}
                          />
                        </div>
                      </ExpandableRowContent>
                    </Td>
                  </Tr>
                ) : null}
              </React.Fragment>
            );
          })}
        </Tbody>
      </ConditionalTableBody>
    </Table>
  );
};

export default QuestionsTable;
