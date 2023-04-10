import React from "react";
import { Bullseye, Spinner } from "@patternfly/react-core";
import { Tbody, Tr, Td } from "@patternfly/react-table";
import { StateError } from "../app-table";
import { StateNoData } from "../app-table/state-no-data";

export interface IConditionalTableBodyProps {
  isLoading: boolean;
  isError: boolean;
  isNoData: boolean;
  numRenderedColumns: number;
  errorEmptyState?: React.ReactNode;
  noDataEmptyState?: React.ReactNode;
  children: React.ReactNode;
}

export const ConditionalTableBody: React.FC<IConditionalTableBodyProps> = ({
  isLoading,
  isError,
  isNoData,
  numRenderedColumns,
  errorEmptyState = null,
  noDataEmptyState = null,
  children,
}) => (
  <>
    {isLoading ? (
      <Tbody>
        <Tr>
          <Td colSpan={numRenderedColumns}>
            <Bullseye>
              <Spinner size="xl" />
            </Bullseye>
          </Td>
        </Tr>
      </Tbody>
    ) : isError ? (
      <Tbody aria-label="Table error">
        <Tr>
          <Td colSpan={numRenderedColumns}>
            <Bullseye>{errorEmptyState || <StateError />}</Bullseye>
          </Td>
        </Tr>
      </Tbody>
    ) : isNoData ? (
      <Tbody aria-label="Table error">
        <Tr>
          <Td colSpan={numRenderedColumns}>
            <Bullseye>{noDataEmptyState || <StateNoData />}</Bullseye>
          </Td>
        </Tr>
      </Tbody>
    ) : (
      children
    )}
  </>
);
