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
import { IconedStatus, IconedStatusPreset } from "@app/components/IconedStatus";
import { TimesCircleIcon } from "@patternfly/react-icons";
import { WarningTriangleIcon } from "@patternfly/react-icons";
export interface IWaveStatusTableProps {
  answers: Answer[];
}

const AnswerTable: React.FC<IWaveStatusTableProps> = ({ answers }) => {
  const { t } = useTranslation();

  const tableControls = useLocalTableControls({
    idProperty: "choice",
    items: answers,
    columnNames: {
      choice: "Answer choice",
      weight: "Weight",
    },
    hasActionsColumn: false,
    hasPagination: false,
    variant: "compact",
  });
  const {
    currentPageItems,
    numRenderedColumns,
    propHelpers: { tableProps, getThProps, getTdProps },
  } = tableControls;

  const getIconByRisk = (risk: string): React.ReactElement => {
    switch (risk) {
      case "green":
        return <IconedStatus preset="Ok" />;
      case "red":
        <IconedStatus icon={<TimesCircleIcon />} status="danger" />;
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
              <Th {...getThProps({ columnKey: "weight" })} />
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
              <>
                <Tr key={answer.choice}>
                  <TableRowContentWithControls
                    {...tableControls}
                    item={answer}
                    rowIndex={rowIndex}
                  >
                    <Td width={40} {...getTdProps({ columnKey: "choice" })}>
                      {answer.choice}
                    </Td>
                    <Td width={20} {...getTdProps({ columnKey: "choice" })}>
                      {getIconByRisk(answer.risk)}
                    </Td>
                  </TableRowContentWithControls>
                </Tr>
                <Tr>
                  {!!answer?.autoanswer_if_tags_present?.length && (
                    <>
                      <div style={{ display: "flex" }}>
                        <Text
                          className={spacing.mrSm}
                          style={{ flex: "0 0 5em" }}
                        >
                          Tags to be applied:
                        </Text>
                        {answer?.autoanswer_if_tags_present?.map((tag: any) => {
                          return (
                            <div style={{ flex: "0 0 6em" }}>
                              <Label color="grey">{tag.tag}</Label>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </Tr>
              </>
            ))}
          </Tbody>
        </ConditionalTableBody>
      </Table>
    </>
  );
};

export default AnswerTable;
