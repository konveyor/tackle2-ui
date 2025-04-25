import { IReadFile, ParsedRule } from "@app/api/models";
import yaml from "js-yaml";

type RuleFileType = "YAML" | null;

export const checkRuleFileType = (filename: string): RuleFileType => {
  const fileExtension = filename.split(".").pop()?.toLowerCase();
  if (fileExtension === "yaml" || fileExtension === "yml") {
    return "YAML";
  } else {
    return null;
  }
};

type ParsedYamlElement = { labels?: string[] };
type ParsedYaml = ParsedYamlElement[] | object;

export const parseRules = (file: IReadFile): ParsedRule => {
  const fileType = checkRuleFileType(file.fileName);

  if (file.data !== undefined && fileType === "YAML") {
    const yamlDoc: ParsedYaml = yaml.load(file.data) as ParsedYaml;
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
