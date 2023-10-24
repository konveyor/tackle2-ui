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
import { Label, Text } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { IconedStatus } from "@app/components/IconedStatus";
import { TimesCircleIcon } from "@patternfly/react-icons";
import { WarningTriangleIcon } from "@patternfly/react-icons";
import { List, ListItem } from "@patternfly/react-core";

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

  const getIconByRisk = (risk: string): React.ReactElement => {
    switch (risk) {
      case "green":
        return <IconedStatus preset="Ok" />;
      case "red":
        return <IconedStatus icon={<TimesCircleIcon />} status="danger" />;
      case "yellow":
        return <IconedStatus icon={<WarningTriangleIcon />} status="warning" />;
      default:
        return <IconedStatus preset="Unknown" />;
    }
  };

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
            {currentPageItems?.map((answer, rowIndex) => {
              return (
                <>
                  <Tr key={answer.text} {...getTrProps({ item: answer })}>
                    <TableRowContentWithControls
                      {...tableControls}
                      item={answer}
                      rowIndex={rowIndex}
                    >
                      <Td width={40} {...getTdProps({ columnKey: "choice" })}>
                        {answer.text}
                      </Td>
                      <Td width={20} {...getTdProps({ columnKey: "choice" })}>
                        {getIconByRisk(answer.risk)}
                      </Td>
                    </TableRowContentWithControls>
                  </Tr>
                  <Tr>
                    {!!answer?.autoAnswerFor?.length && (
                      <>
                        <div style={{ display: "flex" }}>
                          <Text
                            className={spacing.mrSm}
                            style={{ flex: "0 0 5em" }}
                          >
                            Auto answer if the following tags are present:
                          </Text>
                          {answer?.autoAnswerFor?.map((tag, index) => {
                            return (
                              <div key={index} style={{ flex: "0 0 6em" }}>
                                <Label color="grey">{tag.tag}</Label>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </Tr>
                  <Tr>
                    {!!answer?.applyTags?.length && (
                      <>
                        <div style={{ display: "flex" }}>
                          <Text className={spacing.mrSm}>
                            Apply Tags for this answer choice:
                          </Text>
                          {answer?.applyTags?.map((tag, index) => {
                            return (
                              <div key={index} style={{ flex: "0 0 6em" }}>
                                <Label color="grey">{tag.tag}</Label>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </Tr>
                </>
              );
            })}
          </Tbody>
        </ConditionalTableBody>
      </Table>
    </>
  );
};

export default AnswerTable;
