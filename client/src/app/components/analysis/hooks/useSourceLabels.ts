import { useMemo } from "react";
import { unique } from "radash";

import { TargetLabel } from "@app/api/models";
import { useFetchTargets } from "@app/queries/targets";
import { getParsedLabel } from "@app/utils/rules-utils";
import { universalComparator } from "@app/utils/utils";

export const useSourceLabels = () => {
  const { targets } = useFetchTargets();

  const combinedSourceLabels = useMemo(() => {
    const sourceLabelsFromTargets = unique(
      targets
        .map((target) => target?.labels ?? [])
        .filter(Boolean)
        .flat()
        .filter((label) => getParsedLabel(label?.label).labelType === "source"),
      ({ label }) => label
    );

    const combined = unique(
      [...STATIC_SOURCE_LABELS, ...sourceLabelsFromTargets],
      ({ label }) => label
    ).sort((t1, t2) => universalComparator(t1.label, t2.label));

    return combined;
  }, [targets]);

  return combinedSourceLabels;
};

const STATIC_SOURCE_LABELS: TargetLabel[] = [
  { name: "agroal", label: "konveyor.io/source=agroal" },
  { name: "amazon", label: "konveyor.io/source=amazon" },
  { name: "apicurio", label: "konveyor.io/source=apicurio" },
  { name: "artemis", label: "konveyor.io/source=artemis" },
  { name: "avro", label: "konveyor.io/source=avro" },
  { name: "camel", label: "konveyor.io/source=camel" },
  { name: "config", label: "konveyor.io/source=config" },
  { name: "drools", label: "konveyor.io/source=drools" },
  { name: "eap", label: "konveyor.io/source=eap" },
  { name: "eap6", label: "konveyor.io/source=eap6" },
  { name: "eap7", label: "konveyor.io/source=eap7" },
  { name: "eap8", label: "konveyor.io/source=eap8" },
  { name: "eapxp", label: "konveyor.io/source=eapxp" },
  { name: "elytron", label: "konveyor.io/source=elytron" },
  { name: "flyway", label: "konveyor.io/source=flyway" },
  { name: "glassfish", label: "konveyor.io/source=glassfish" },
  { name: "hibernate", label: "konveyor.io/source=hibernate" },
  { name: "hibernate-search", label: "konveyor.io/source=hibernate-search" },
  { name: "jakarta-ee", label: "konveyor.io/source=jakarta-ee" },
  { name: "java-ee", label: "konveyor.io/source=java-ee" },
  { name: "jbpm", label: "konveyor.io/source=jbpm" },
  { name: "jboss", label: "konveyor.io/source=jboss" },
  { name: "javaee", label: "konveyor.io/source=javaee" },
  { name: "jdbc", label: "konveyor.io/source=jdbc" },
  { name: "jonas", label: "konveyor.io/source=jonas" },
  { name: "jrun", label: "konveyor.io/source=jrun" },
  { name: "jsonb", label: "konveyor.io/source=jsonb" },
  { name: "jsonp", label: "konveyor.io/source=jsonp" },
  { name: "kafka", label: "konveyor.io/source=kafka" },
  { name: "keycloak", label: "konveyor.io/source=keycloak" },
  { name: "kubernetes", label: "konveyor.io/source=kubernetes" },
  { name: "liquibase", label: "konveyor.io/source=liquibase" },
  { name: "log4j", label: "konveyor.io/source=log4j" },
  { name: "logging", label: "konveyor.io/source=logging" },
  { name: "micrometer", label: "konveyor.io/source=micrometer" },
  { name: "narayana", label: "konveyor.io/source=narayana" },
  { name: "openjdk", label: "konveyor.io/source=openjdk" },
  { name: "openjdk11", label: "konveyor.io/source=openjdk11" },
  { name: "openshift", label: "konveyor.io/source=openshift" },
  { name: "opentelemetry", label: "konveyor.io/source=opentelemetry" },
  { name: "oraclejdk", label: "konveyor.io/source=oraclejdk" },
  { name: "orion", label: "konveyor.io/source=orion" },
  { name: "picocli", label: "konveyor.io/source=picocli" },
  { name: "resin", label: "konveyor.io/source=resin" },
  { name: "resteasy", label: "konveyor.io/source=resteasy" },
  { name: "rmi", label: "konveyor.io/source=rmi" },
  { name: "rpc", label: "konveyor.io/source=rpc" },
  { name: "seam", label: "konveyor.io/source=seam" },
  { name: "soa", label: "konveyor.io/source=soa" },
  { name: "spring", label: "konveyor.io/source=spring" },
  { name: "springboot", label: "konveyor.io/source=springboot" },
  { name: "thorntail", label: "konveyor.io/source=thorntail" },
  { name: "weblogic", label: "konveyor.io/source=weblogic" },
  { name: "websphere", label: "konveyor.io/source=websphere" },
];
