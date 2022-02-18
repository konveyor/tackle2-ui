import { Review } from "@app/api/models";
import {
  TableRowData,
  ColumnIndex,
  compareToByColumn,
} from "../adoption-candidate-table";

describe("AdoptionCandidateTable", () => {
  const genericReview: Review = {
    businessCriticality: 999,
    workPriority: 999,
    effortEstimate: "small",
    proposedAction: "refactor",
  };

  it("Sort by criticality: criticality=zero is greater than review=undefined", () => {
    // Given
    const rows: TableRowData[] = [
      {
        application: {
          name: "app0",
          review: { ...genericReview, businessCriticality: 0 },
        },
        risk: "UNKNOWN",
      },
      {
        application: {
          name: "app1",
          review: { ...genericReview, businessCriticality: 1 },
        },
        risk: "UNKNOWN",
      },
      {
        application: {
          name: "app2",
          review: { ...genericReview, businessCriticality: 2 },
        },
        risk: "UNKNOWN",
      },
      {
        application: { name: "appUndefined1", review: undefined },
        risk: "UNKNOWN",
      },
      {
        application: { name: "appUndefined2", review: undefined },
        risk: "UNKNOWN",
      },
    ];

    // When
    rows.sort((a, b) => compareToByColumn(a, b, ColumnIndex.CRITICALITY));

    // Then
    expect(rows[0].application.name).toBe("appUndefined1");
    expect(rows[1].application.name).toBe("appUndefined2");
    expect(rows[2].application.name).toBe("app0");
    expect(rows[3].application.name).toBe("app1");
    expect(rows[4].application.name).toBe("app2");
  });

  it("Sort by priority: priority=zero is greater than review=undefined", () => {
    // Given
    const rows: TableRowData[] = [
      {
        application: {
          name: "app0",
          review: { ...genericReview, workPriority: 0 },
        },
        risk: "UNKNOWN",
      },
      {
        application: {
          name: "app1",
          review: { ...genericReview, workPriority: 1 },
        },
        risk: "UNKNOWN",
      },
      {
        application: {
          name: "app2",
          review: { ...genericReview, workPriority: 2 },
        },
        risk: "UNKNOWN",
      },
      {
        application: { name: "appUndefined1", review: undefined },
        risk: "UNKNOWN",
      },
      {
        application: { name: "appUndefined2", review: undefined },
        risk: "UNKNOWN",
      },
    ];

    // When
    rows.sort((a, b) => compareToByColumn(a, b, ColumnIndex.PRIORITY));

    // Then
    expect(rows[0].application.name).toBe("appUndefined1");
    expect(rows[1].application.name).toBe("appUndefined2");
    expect(rows[2].application.name).toBe("app0");
    expect(rows[3].application.name).toBe("app1");
    expect(rows[4].application.name).toBe("app2");
  });

  it("Sort by confidence: confidence=zero is greater than confidence=undefined", () => {
    // Given
    const rows: TableRowData[] = [
      { application: { name: "app0" }, confidence: 0, risk: "UNKNOWN" },
      { application: { name: "app1" }, confidence: 1, risk: "UNKNOWN" },
      { application: { name: "app2" }, confidence: 2, risk: "UNKNOWN" },
      {
        application: { name: "appUndefined1" },
        confidence: undefined,
        risk: "UNKNOWN",
      },
      {
        application: { name: "appUndefined2" },
        confidence: undefined,
        risk: "UNKNOWN",
      },
    ];

    // When
    rows.sort((a, b) => compareToByColumn(a, b, ColumnIndex.CONFIDENCE));

    // Then
    expect(rows[0].application.name).toBe("appUndefined1");
    expect(rows[1].application.name).toBe("appUndefined2");
    expect(rows[2].application.name).toBe("app0");
    expect(rows[3].application.name).toBe("app1");
    expect(rows[4].application.name).toBe("app2");
  });
});
