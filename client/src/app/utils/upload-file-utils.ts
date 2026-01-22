import { unique } from "radash";

import { TargetLabel, UploadFile } from "@app/api/models";

import { getParsedLabel, parseRules } from "./rules-utils";

export const buildSetOfTargetLabels = (
  ruleFiles: UploadFile[],
  existingLabels: TargetLabel[] = []
) => {
  const targetLabels = unique(
    ruleFiles.reduce(
      (acc, file) => {
        const { allLabels } = parseRules(file);
        const fileTargetLabels =
          allLabels?.map(
            (label): TargetLabel => ({
              name: getParsedLabel(label).labelValue,
              label,
            })
          ) ?? [];
        acc.push(...fileTargetLabels);
        return acc;
      },
      [...existingLabels]
    ),
    ({ name }) => name
  );

  return targetLabels;
};
