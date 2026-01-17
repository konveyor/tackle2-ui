import * as yaml from "js-yaml";
import { group } from "radash";

import { ParsedRule, TargetLabel, UploadFile } from "@app/api/models";

type RuleFileType = "YAML" | null;

export const checkRuleFileType = (filename: string): RuleFileType => {
  const fileExtension = filename.split(".").pop()?.toLowerCase();
  if (fileExtension === "yaml" || fileExtension === "yml") {
    return "YAML";
  } else {
    return null;
  }
};

export const validateYamlFile = (
  data: string
): {
  state: "valid" | "error";
  message?: string;
} => {
  try {
    yaml.load(data);
    return {
      state: "valid",
    };
  } catch (err) {
    const yamlException = err as yaml.YAMLException;
    return {
      state: "error",
      message: `${yamlException.reason} (ln: ${yamlException.mark.line}, col: ${yamlException.mark.column})`,
    };
  }
};

type ParsedYamlElement = { labels?: string[] };
type ParsedYaml = ParsedYamlElement[] | object;

export const parseRules = (file: UploadFile): ParsedRule => {
  const fileType = checkRuleFileType(file.fileName);

  if (file.contents !== undefined && fileType === "YAML") {
    const yamlDoc: ParsedYaml = yaml.load(file.contents) as ParsedYaml;
    const yamlList = Array.isArray(yamlDoc) ? yamlDoc : [yamlDoc];
    const yamlLabels = Array.from(
      new Set(
        yamlList?.flatMap((parsedRule) => {
          return parsedRule?.labels ? parsedRule?.labels : [];
        }) || []
      )
    );
    const allLabels = getLabels(yamlLabels);
    return {
      source: allLabels?.sourceLabel,
      target: allLabels?.targetLabel,
      otherLabels: allLabels?.otherLabels,
      allLabels: allLabels?.allLabels,
      total: yamlList?.filter((parsedRule) => parsedRule?.ruleID)?.length ?? 0,
      ...(file.responseID && {
        fileID: file.responseID,
      }),
    };
  }

  return {
    source: null,
    target: null,
    total: 0,
  };
};

interface ILabelMap {
  sourceLabel: string;
  targetLabel: string;
  otherLabels: string[];
  allLabels: string[];
}

interface ParsedLabel {
  labelType: string;
  labelValue: string;
}

export const toLabelValue = (label?: string) => label?.split("=").pop() ?? "";

export const getParsedLabel = (label: string | null): ParsedLabel => {
  if (label === null) {
    return {
      labelType: "",
      labelValue: "",
    };
  }

  const char1 = label.indexOf("/") + 1;
  const char2 = label.lastIndexOf("=");
  const type = label.substring(char1, char2);
  const value = toLabelValue(label);

  return {
    labelType: type || "",
    labelValue: value || "",
  };
};

export const getLabels = (labels: string[]) =>
  labels.reduce(
    (map: ILabelMap, label) => {
      const { labelType, labelValue } = getParsedLabel(label);
      const sourceValue = labelType === "source" ? labelValue : "";
      const targetValue = labelType === "target" ? labelValue : "";
      return Object.assign(
        { sourceLabel: "", targetLabel: "", otherLabels: [] },
        map,
        {
          sourceLabel: sourceValue ? label : map.sourceLabel,
          targetLabel: targetValue ? label : map.targetLabel,
          otherLabels:
            !sourceValue && !targetValue
              ? [...map.otherLabels, label]
              : map.otherLabels,
          allLabels: [...map.allLabels, label],
        }
      );
    },
    { sourceLabel: "", targetLabel: "", otherLabels: [], allLabels: [] }
  );

export type ParsedTargetLabel = {
  /** The full object this object was parsed from */
  targetLabel: TargetLabel;
  /** Given name of the label, e.g. "my-target" (does not need to match the `value`) */
  name: string;
  /** Full label string, e.g. "konveyor.io/target=my-target" */
  label: string;
  /** Type of label, e.g. "source" or "target" */
  type: "source" | "target" | "other";
  /** Value of label, e.g. "my-target" */
  value: string;
};

export const parseLabel = (label: TargetLabel): ParsedTargetLabel => {
  const regex = /^konveyor\.io\/([a-zA-Z]+)=(.+)$/;
  const match = label.label.match(regex);
  if (match) {
    const [, type, value] = match;
    return {
      targetLabel: label,
      name: label.name,
      label: label.label,
      type: type === "source" || type === "target" ? type : "other",
      value,
    };
  }
  return {
    targetLabel: label,
    name: label.name,
    label: label.label,
    type: "other",
    value: label.label,
  };
};

export const parseLabels = (labels: TargetLabel[]) => {
  return labels.map(parseLabel);
};

export const parseAndGroupLabels = (
  labels: TargetLabel[]
): Record<ParsedTargetLabel["type"], ParsedTargetLabel[]> => {
  const parsedLabels = parseLabels(labels);
  return {
    source: [],
    target: [],
    other: [],
    ...group(parsedLabels, ({ type }) => type),
  };
};
