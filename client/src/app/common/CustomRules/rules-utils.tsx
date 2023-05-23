import { IReadFile, ParsedRule, Ruleset } from "@app/api/models";

export const parseRules = (file: IReadFile): ParsedRule => {
  if (file.data) {
    let source: string | null = null;
    let target: string | null = null;
    let rulesCount = 0;

    const payload = atob(file.data.substring(21));
    const parser = new DOMParser();
    const xml = parser.parseFromString(payload, "text/xml");

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
      source,
      target,
      total: rulesCount,
      allLabels,
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

export const getRulesetTargetList = (ruleset: Ruleset) => {
  return ruleset.rules.reduce((acc: string[], rule) => {
    return [...acc, rule?.metadata?.target || ""];
  }, []);
};
