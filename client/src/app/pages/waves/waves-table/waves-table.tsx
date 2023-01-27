import React from "react";
import {
  TableComposable,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  TdProps,
  ExpandableRowContent,
} from "@patternfly/react-table";

import CodeBranchIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";
import CodeIcon from "@patternfly/react-icons/dist/esm/icons/code-icon";
import CubeIcon from "@patternfly/react-icons/dist/esm/icons/cube-icon";
import { Application, Stakeholder, Wave } from "@app/api/models";
import dayjs from "dayjs";
import applications from "@app/pages/applications";

export const WavesTable: React.FunctionComponent = () => {
  var now = dayjs();
  // In real usage, this data would come from some external source like an API via props.
  const waves: Wave[] = [
    {
      name: "wave1",
      startDate: "2018-05-03 22:15:01",
      endDate: "20120-05-03 22:15:014",
      applications: [],
      stakeholders: [],
      status: "n/a",
    },
    {
      name: "wave2",
      startDate: "2019-05-03 22:15:01",
      endDate: "2020-05-03 22:15:014",
      applications: [],
      stakeholders: [],
      status: "n/a",
    },
  ];

  const columnNames = {
    name: "Name",
    startDate: "Start date",
    endDate: "End date",
    applications: "Applications",
    stakeholders: "Stakeholders",
    status: "Status",
  };

  type ColumnKey = keyof typeof columnNames;

  const [expandedCells, setExpandedCells] = React.useState<
    Record<string, ColumnKey>
  >({
    wave1: "applications", // Default to the first cell of the first row being expanded
  });
  const setCellExpanded = (
    application: Application,
    columnKey: ColumnKey,
    isExpanding = true
  ) => {
    const newExpandedCells = { ...expandedCells };
    if (isExpanding) {
      newExpandedCells[application.name] = columnKey;
    } else {
      delete newExpandedCells[application.name];
    }
    setExpandedCells(newExpandedCells);
  };
  const compoundExpandParams = (
    application: Application,
    columnKey: ColumnKey,
    rowIndex: number,
    columnIndex: number
  ): TdProps["compoundExpand"] => ({
    isExpanded: expandedCells[application.name] === columnKey,
    onToggle: () =>
      setCellExpanded(
        application,
        columnKey,
        expandedCells[application.name] !== columnKey
      ),
    expandId: "composable-compound-expandable-example",
    rowIndex,
    columnIndex,
  });

  return (
    <TableComposable aria-label="Compound expandable table">
      <Thead>
        <Tr>
          <Th>{columnNames.name}</Th>
          <Th>{columnNames.startDate}</Th>
          <Th>{columnNames.endDate}</Th>
          <Th>{columnNames.applications}</Th>
          <Th>{columnNames.stakeholders}</Th>
          <Th>{columnNames.status}</Th>
          <Th />
        </Tr>
      </Thead>
      {waves.map((wave: Wave, rowIndex: number) => {
        const expandedCellKey = expandedCells[wave.name];
        const isRowExpanded = !!expandedCellKey;
        return (
          <Tbody key={wave.name} isExpanded={isRowExpanded}>
            <Tr>
              <Td width={25} dataLabel={columnNames.name} component="th">
                <a href="#">{wave.name}</a>
              </Td>
              <Td width={25} dataLabel={columnNames.startDate} component="th">
                <a href="#">{wave.startDate}</a>
              </Td>
              <Td width={25} dataLabel={columnNames.endDate} component="th">
                <a href="#">{wave.endDate}</a>
              </Td>
              <Td
                width={10}
                dataLabel={columnNames.applications}
                compoundExpand={compoundExpandParams(
                  wave,
                  "applications",
                  rowIndex,
                  1
                )}
              >
                <CodeBranchIcon key="icon" /> {wave.applications.length}
              </Td>
              <Td
                width={10}
                dataLabel={columnNames.stakeholders}
                compoundExpand={compoundExpandParams(
                  wave,
                  "stakeholders",
                  rowIndex,
                  2
                )}
              >
                <CodeIcon key="icon" /> {wave.stakeholders.length}
              </Td>
              <Td width={15} dataLabel={columnNames.status}>
                {wave.status}
              </Td>
              <Td width={30}>
                <a href="#">{wave.status}</a>
              </Td>
            </Tr>
            {isRowExpanded ? (
              <Tr isExpanded={isRowExpanded}>
                <Td
                  dataLabel={columnNames[expandedCellKey]}
                  noPadding
                  colSpan={6}
                >
                  <ExpandableRowContent>
                    <div className="pf-u-m-md">
                      Lorem ipsum sit dolor. Lorem ipsum sit dolor. Lorem ipsum
                      sit dolor. Lorem ipsum sit dolor. Lorem ipsum sit dolor.
                      Lorem ipsum sit dolor. Lorem ipsum sit dolor. Lorem ipsum
                      sit dolor. Lorem ipsum sit dolor. Lorem ipsum sit dolor.
                      Lorem ipsum sit dolor. Lorem ipsum sit dolor. Lorem ipsum
                      sit dolor. Lorem ipsum sit dolor. Lorem ipsum sit dolor.
                      Lorem ipsum sit dolor. Lorem ipsum sit dolor. Lorem ipsum
                      sit dolor. Lorem ipsum sit dolor. Lorem ipsum sit dolor.
                      Lorem ipsum sit dolor. Lorem ipsum sit dolor. Lorem ipsum
                      sit dolor. Lorem ipsum sit dolor. Lorem ipsum sit dolor.
                      Lorem ipsum sit dolor. Lorem ipsum sit dolor. Lorem ipsum
                      sit dolor. Lorem ipsum sit dolor. Lorem ipsum sit dolor.
                      Lorem ipsum sit dolor. Lorem ipsum sit dolor. Lorem ipsum
                      sit dolor.
                    </div>
                  </ExpandableRowContent>
                </Td>
              </Tr>
            ) : null}
          </Tbody>
        );
      })}
    </TableComposable>
  );
};
