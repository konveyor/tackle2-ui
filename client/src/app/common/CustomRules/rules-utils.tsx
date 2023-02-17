import { IReadFile, Rule } from "@app/api/models";

export const parseRules = (file: IReadFile) => {
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

    const rules: Rule[] = [
      {
        name: file.fileName,
        source: source,
        target: target,
        total: rulesCount,
      },
    ];

    return {
      parsedRules: rules,
      parsedSource: source,
      parsedTarget: target,
    };
  } else {
    return {
      parsedRules: [],
      parsedSource: null,
      parsedTarget: null,
    };
  }
};
