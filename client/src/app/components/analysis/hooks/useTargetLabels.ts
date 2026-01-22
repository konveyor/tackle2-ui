import { useMemo } from "react";
import { unique } from "radash";

import { TargetLabel } from "@app/api/models";
import { useFetchTargets } from "@app/queries/targets";
import { getParsedLabel } from "@app/utils/rules-utils";
import { universalComparator } from "@app/utils/utils";

export const useTargetLabels = () => {
  const { targets } = useFetchTargets();

  const combinedTargetLabels = useMemo(() => {
    const targetLabelsFromTargets = unique(
      targets
        .map((target) => target?.labels ?? [])
        .filter(Boolean)
        .flat()
        .filter((label) => getParsedLabel(label?.label).labelType === "target"),
      ({ label }) => label
    );

    const combined = unique(
      [...STATIC_TARGET_LABELS, ...targetLabelsFromTargets],
      ({ label }) => label
    ).sort((t1, t2) => universalComparator(t1.label, t2.label));

    return combined;
  }, [targets]);

  return combinedTargetLabels;
};

const STATIC_TARGET_LABELS: TargetLabel[] = [
  { name: "Drools", label: "konveyor.io/target=drools" },
  { name: "EAP", label: "konveyor.io/target=eap" },
  { name: "EAP 6", label: "konveyor.io/target=eap6" },
  { name: "EAP XP", label: "konveyor.io/target=eapxp" },
  { name: "FSW", label: "konveyor.io/target=fsw" },
  { name: "Fuse", label: "konveyor.io/target=fuse" },
  { name: "Hibernate", label: "konveyor.io/target=hibernate" },
  { name: "Hibernate Search", label: "konveyor.io/target=hibernate-search" },
  { name: "Java EE", label: "konveyor.io/target=java-ee" },
  { name: "jBPM", label: "konveyor.io/target=jbpm" },
  { name: "OpenJDK", label: "konveyor.io/target=openjdk" },
  { name: "RESTEasy", label: "konveyor.io/target=resteasy" },
];
