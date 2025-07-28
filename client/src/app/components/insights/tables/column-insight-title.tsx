import { AnalysisInsight } from "@app/api/models";
import React from "react";

export const InsightTitleColumn: React.FC<{
  insight: Pick<AnalysisInsight, "description" | "name">;
}> = ({ insight }) => {
  const title =
    insight?.description || insight?.name?.split("\n")[0] || "*Unnamed*";

  return <>{title}</>;
};
