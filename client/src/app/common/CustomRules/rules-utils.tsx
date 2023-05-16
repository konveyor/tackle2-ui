import { IReadFile, ParsedRule, RuleBundle, Ruleset } from "@app/api/models";
import yaml from "js-yaml";

export const parseRules = (file: IReadFile): ParsedRule => {
  if (file.data) {
    const payload = atob(file.data.substring(31));
    const yamlDoc = yaml.load(payload) as any[];
    const yamlLabels = yamlDoc?.reduce((acc, parsedLine) => {
      const newLabels = parsedLine?.labels ? parsedLine?.labels : [];
      return [...acc, ...newLabels];
    }, []);
    const allLabels = getLabels(yamlLabels);
    return {
      source: allLabels?.sourceLabel,
      target: allLabels?.targetLabel,
      otherLabels: allLabels?.otherLabels,
      allLabels: allLabels?.allLabels,
      total: 0,
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
};

interface ILabelMap {
  sourceLabel: string;
  targetLabel: string;
  otherLabels: string[];
  allLabels: string[];
}

export const getLabels = (labels: string[]) =>
  labels.reduce(
    (map: ILabelMap, label) => {
      const char1 = label.indexOf("/") + 1;
      const char2 = label.lastIndexOf("=");
      const type = label.substring(char1, char2);
      const value = label.split("=").pop();
      const sourceValue = type === "source" ? value : "";
      const targetValue = type === "target" ? value : "";
      return Object.assign(
        { sourceLabel: "", targetLabel: "", otherLabels: [] },
        map,
        {
          sourceLabel: sourceValue ? label : map.sourceLabel,
          targetLabel: targetValue ? label : map.targetLabel,
          otherLabels: [...map.otherLabels, label],
          allLabels: [...map.allLabels, label],
        }
      );
    },
    { sourceLabel: "", targetLabel: "", otherLabels: [], allLabels: [] }
  );

export const getruleBundleTargetList = (ruleBundle: RuleBundle) => {
  return ruleBundle.rulesets.reduce((acc: string[], ruleset) => {
    return [...acc, ruleset?.metadata?.target || ""];
  }, []);
};
