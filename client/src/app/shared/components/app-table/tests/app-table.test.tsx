import React from "react";
import { Label, Skeleton, Spinner } from "@patternfly/react-core";
import {
  ICell,
  IRow,
  IActions,
  SortColumn,
  sortable,
} from "@patternfly/react-table";

import { AppTable } from "../app-table";
import { render, screen } from "@app/test-config/test-utils";

describe("AppTable", () => {
  const columns: ICell[] = [
    { title: "Col1", transforms: [sortable] },
    { title: "Col2" },
    { title: "Col3" },
  ];
  const rows: IRow[] = [...Array(15)].map((_, rowIndex) => {
    return {
      cells: [...Array(columns.length)].map((_, colIndex) => ({
        title: <Label>${`${rowIndex},${colIndex}`}</Label>,
      })),
    };
  });
  const actions: IActions = [
    {
      title: "Action1",
      onClick: jest.fn,
    },
    {
      title: "Action2",
      onClick: jest.fn,
    },
  ];

  it("Renders without crashing", () => {
    const wrapper = render(
      <AppTable
        cells={columns}
        rows={rows}
        isLoading={false}
        filtersApplied={false}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it.skip("Renders error", () => {
    render(
      <AppTable
        cells={columns}
        rows={rows}
        isLoading={false}
        fetchError={"Any error"}
        filtersApplied={false}
      />
    );
    expect(
      screen.getByRole("heading", { name: /Unable to connect/i })
    ).toBeInTheDocument();
  });

  it("Renders loading with spinner", () => {
    render(
      <AppTable
        cells={columns}
        rows={rows}
        isLoading={true}
        loadingVariant="spinner"
        filtersApplied={false}
      />
    );
    expect(screen.getByRole("cell", { name: /Loading/i })).toBeInTheDocument();
  });

  it.skip("Renders empty table without aplying filters", () => {
    render(
      <AppTable
        cells={columns}
        rows={[]}
        isLoading={false}
        filtersApplied={false}
      />
    );
    expect(
      screen.getByRole("heading", { name: /noDataAvailable/i })
    ).toBeInTheDocument();
  });

  it.skip("Renders empty table after applying filters", () => {
    const wrapper = render(
      <AppTable
        cells={columns}
        rows={[]}
        isLoading={false}
        filtersApplied={true}
      />
    );
    expect(
      screen.getByRole("heading", { name: /noResultsFound/i })
    ).toBeInTheDocument();
  });
});
