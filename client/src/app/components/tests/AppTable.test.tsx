import React from "react";
import { Label } from "@patternfly/react-core";
import { ICell, IRow, sortable } from "@patternfly/react-table";

import { render, screen } from "@app/test-config/test-utils";

import { AppTable } from "../AppTable";

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
    render(
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
