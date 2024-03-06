import { IReadFile, ParsedRule } from "@app/api/models";
import yaml from "js-yaml";

type RuleFileType = "YAML" | "XML" | null;

export const checkRuleFileType = (filename: string): RuleFileType => {
  const fileExtension = filename.split(".").pop()?.toLowerCase();
  if (fileExtension === ("yaml" || "yml")) {
    return "YAML";
  } else if (fileExtension === "xml") {
    return "XML";
  } else return null;
};
type ParsedYamlElement = { labels?: string[] };
type ParsedYaml = ParsedYamlElement[] | {};

export const parseRules = (file: IReadFile): ParsedRule => {
  if (file.data) {
    if (checkRuleFileType(file.fileName) === "YAML") {
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
        total:
          yamlList?.filter((parsedRule) => parsedRule?.ruleID)?.length ?? 0,
        ...(file.responseID && {
          fileID: file.responseID,
        }),
      };
    } else if (checkRuleFileType(file.fileName) === "XML") {
      let source: string | null = null;
      let target: string | null = null;
      let rulesCount = 0;

      const parser = new DOMParser();
      const xml = parser.parseFromString(file.data, "text/xml");

      const ruleSets = xml.getElementsByTagName("ruleset");

      if (ruleSets && ruleSets.length > 0) {
        const metadata = ruleSets[0].getElementsByTagName("metadata");

        if (metadata && metadata.length > 0) {
          const sources = metadata[0].getElementsByTagName("sourceTechnology");
          if (sources && sources.length > 0) source = sources[0].id;

          const targets = metadata[0].getElementsByTagName("targetTechnology");
          if (targets && targets.length > 0) target = targets[0].id;
        }

        const rulesGroup = ruleSets[0].getElementsByTagName("rules");
        if (rulesGroup && rulesGroup.length > 0)
          rulesCount = rulesGroup[0].getElementsByTagName("rule").length;
      }
      const allLabels = [
        ...(source ? [`konveyor.io/source=${source}`] : []),
        ...(target ? [`konveyor.io/target=${target}`] : []),
      ];
      return {
        source: source,
        target: target,
        otherLabels: allLabels,
        allLabels: allLabels,
        total: rulesCount,
        ...(file.responseID && {
          fileID: file.responseID,
        }),
      };
    } else {
      return {
        source: null,
        target: null,
        total: 0,
      };
    }
  } else {
    return {
      source: null,
      target: null,
      total: 0,
    };
  }
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
  const value = label.split("=").pop();

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
