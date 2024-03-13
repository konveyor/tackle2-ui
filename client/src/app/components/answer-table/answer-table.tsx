import React from "react";
import { useTranslation } from "react-i18next";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { useLocalTableControls } from "@app/hooks/table-controls";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import { Answer } from "@app/api/models";
import { Label, Text, Tooltip } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { IconedStatus } from "@app/components/IconedStatus";
import { TimesCircleIcon } from "@patternfly/react-icons";
import { WarningTriangleIcon } from "@patternfly/react-icons";
import { List, ListItem } from "@patternfly/react-core";
import RiskIcon from "../risk-icon/risk-icon";
import { InfoCircleIcon } from "@patternfly/react-icons";

export interface IAnswerTableProps {
  answers: Answer[];
  hideAnswerKey?: boolean;
}

const AnswerTable: React.FC<IAnswerTableProps> = ({
  answers,
  hideAnswerKey,
}) => {
  const { t } = useTranslation();

  const tableControls = useLocalTableControls({
    tableName: "answer-table",
    idProperty: "text",
    items: hideAnswerKey
      ? answers.filter((answer) => answer.selected)
      : answers,
    columnNames: {
      choice: "Answer choice",
      weight: "Weight",
    },
    variant: "compact",
  });
  const {
    currentPageItems,
    numRenderedColumns,
    propHelpers: { tableProps, getThProps, getTrProps, getTdProps },
  } = tableControls;

  return (
    <>
      <Table {...tableProps} aria-label={`Answer table for question`}>
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "choice" })} />
              <Th
                {...getThProps({ columnKey: "weight" })}
                info={{
                  tooltip: (
                    <>
                      <Text>
                        This column shows the associated risk weight of an
                        answered question.
                      </Text>
                      <List isPlain className={spacing.mtLg}>
                        <ListItem>
                          <IconedStatus
                            icon={<TimesCircleIcon />}
                            status="danger"
                            label="is High risk"
                          />
                        </ListItem>
                        <ListItem>
                          <IconedStatus
                            icon={<WarningTriangleIcon />}
                            status="warning"
                            label="is Medium risk"
                          />
                        </ListItem>
                        <ListItem>
                          <IconedStatus
                            preset="Ok"
                            label="is Low risk"
                          ></IconedStatus>
                        </ListItem>
                      </List>
                    </>
                  ),
                }}
              />
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isNoData={answers.length === 0}
          numRenderedColumns={numRenderedColumns}
          noDataEmptyState={
            <div>
              <NoDataEmptyState title="No answers assigned to this question." />
            </div>
          }
        >
          <Tbody>
            {currentPageItems?.map((answer, rowIndex) => (
              <React.Fragment key={rowIndex}>
                <Tr {...getTrProps({ item: answer })}>
                  <TableRowContentWithControls
                    {...tableControls}
                    item={answer}
                    rowIndex={rowIndex}
                  >
                    <Td width={40} {...getTdProps({ columnKey: "choice" })}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span>{answer.text}</span>
                        {(!!answer?.autoAnswerFor?.length ||
                          !!answer?.applyTags?.length) && (
                          <Tooltip
                            content={
                              <div
                                className="pf-v5-c-tooltip__content pf-m-text-align-left"
                                id="conditional-tooltip-content"
                              >
                                {!!answer?.autoAnswerFor?.length && (
                                  <>
                                    <Text>
                                      {t("message.autoSelectTooltip")}
                                    </Text>
                                    <List isPlain>
                                      {answer.autoAnswerFor.map(
                                        (tag, index) => (
                                          <ListItem key={index}>
                                            <Label color="blue">
                                              {tag.tag}
                                            </Label>
                                          </ListItem>
                                        )
                                      )}
                                    </List>
                                  </>
                                )}
                                {!!answer?.applyTags?.length && (
                                  <>
                                    <Text>{t("message.autoTagTooltip")}</Text>
                                    <List isPlain>
                                      {answer.applyTags.map((tag, index) => (
                                        <ListItem key={index}>
                                          <Label color="blue">{tag.tag}</Label>
                                        </ListItem>
                                      ))}
                                    </List>
                                  </>
                                )}
                              </div>
                            }
                          >
                            <span className={spacing.mlXs}>
                              <InfoCircleIcon />
                            </span>
                          </Tooltip>
                        )}
                      </div>
                    </Td>

                    <Td width={20} {...getTdProps({ columnKey: "weight" })}>
                      <RiskIcon risk={answer.risk} />
                    </Td>
                  </TableRowContentWithControls>
                </Tr>
                {/* ... other rows ... */}
              </React.Fragment>
            ))}
          </Tbody>
        </ConditionalTableBody>
      </Table>
    </>
  );
};

export default AnswerTable;
