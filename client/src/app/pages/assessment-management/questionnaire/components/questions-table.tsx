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
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useTranslation } from "react-i18next";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { CustomYamlAssessmentQuestion } from "@app/api/models";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { Label } from "@patternfly/react-core";
import AnswerTable from "./answer-table";

const QuestionsTable: React.FC<{
  fetchError: boolean;
  questions?: CustomYamlAssessmentQuestion[];
}> = ({ fetchError = false, questions }) => {
  const tableControls = useLocalTableControls({
    idProperty: "formulation",
    items: questions || [],
    columnNames: {
      formulation: "Name",
    },
    hasActionsColumn: true,
    isSelectable: false,
    expandableVariant: "single",
  });

  const {
    currentPageItems,
    numRenderedColumns,
    propHelpers: {
      tableProps,
      getThProps,
      getTdProps,
      getExpandedContentTdProps,
    },
    expansionDerivedState: { isCellExpanded },
  } = tableControls;

  const { t } = useTranslation();

  return (
    <Table {...tableProps} aria-label="Questions table" isExpandable>
      <Thead>
        <Tr>
          <TableHeaderContentWithControls {...tableControls}>
            <Th {...getThProps({ columnKey: "formulation" })} />
          </TableHeaderContentWithControls>
        </Tr>
      </Thead>
      <Tbody>
        {currentPageItems?.map((question, rowIndex) => (
          <>
            <Tr key={question.formulation}>
              <TableRowContentWithControls
                {...tableControls}
                item={question}
                rowIndex={rowIndex}
              >
                <Td width={100} {...getTdProps({ columnKey: "formulation" })}>
                  {(!!question?.include_if_tags_present?.length ||
                    !!question?.skip_if_tags_present?.length) && (
                    <Label className={spacing.mrSm}>Conditional</Label>
                  )}
                  {question.formulation}
                </Td>
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
                    {question.explanation}
                    <AnswerTable answers={question.answers} />
                  </ExpandableRowContent>
                </Td>
              </Tr>
            ) : null}
          </>
        ))}
      </Tbody>
    </Table>
  );
};

export default QuestionsTable;
