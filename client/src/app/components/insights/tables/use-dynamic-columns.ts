export interface TableColumns {
  description: boolean | string;
  category: boolean | string;
  source: boolean | string;
  target: boolean | string;
  effort: boolean | string;
  affected: boolean | string;
}

export const useDynamicColumns = (
  columns?: Partial<TableColumns>,
  columnNames?: Partial<Record<keyof TableColumns, string>>
) => {
  const defaultNames = Object.assign(
    {
      description: "Insight",
      category: "Category",
      source: "Source",
      target: "Target(s)",
      effort: "Effort",
      affected: "Affected applications",
    },
    columnNames
  );

  const fullSet: TableColumns = Object.assign(
    {
      description: true,
      category: true,
      source: true,
      target: true,
      effort: false,
      affected: true,
    },
    columns
  );

  const activeSet: Record<string, string> = {};
  Object.entries(fullSet).forEach(([key, value]) => {
    if (typeof value === "string") {
      activeSet[key] = value;
    } else if (value === true) {
      activeSet[key] = defaultNames[key as keyof typeof defaultNames];
    }
  });
  return activeSet;
};
