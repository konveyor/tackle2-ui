import { APP_BRAND, BrandType } from "@app/Constants";
import { TargetLabel } from "@app/api/models";

const openTargets: TargetLabel[] = [
  {
    name: "konveyor.io/target=camel",
    label: "konveyor.io/target=camel",
  },
  {
    name: "cloud-readiness",
    label: "konveyor.io/target=cloud-readiness",
  },
  {
    name: "drools",
    label: "konveyor.io/target=drools",
  },
  { name: "eap", label: "konveyor.io/target=eap" },
  { name: "eap6", label: "konveyor.io/target=eap6" },
  { name: "eap7", label: "konveyor.io/target=eap7" },
  { name: "eap8", label: "konveyor.io/target=eap8" },
  { name: "eapxp", label: "konveyor.io/target=eapxp" },
  { name: "fsw", label: "konveyor.io/target=fsw" },
  {
    name: "fuse",
    label: "konveyor.io/target=fuse",
  },
  { name: "hibernate", label: "konveyor.io/target=hibernate" },
  { name: "hibernate-search", label: "konveyor.io/target=hibernate-search" },
  { name: "jakarta-ee", label: "konveyor.io/target=jakarta-ee" },
  { name: "java-ee", label: "konveyor.io/target=java-ee" },
  { name: "jbpm", label: "konveyor.io/target=jbpm" },
  { name: "linux", label: "konveyor.io/target=linux" },
  { name: "openjdk", label: "konveyor.io/target=openjdk" },
  { name: "openjdk11", label: "konveyor.io/target=openjdk11" },
  { name: "openjdk17", label: "konveyor.io/target=openjdk17" },
  { name: "openliberty", label: "konveyor.io/target=openliberty" },
  { name: "quarkus", label: "konveyor.io/target=quarkus" },
  { name: "resteasy", label: "konveyor.io/target=resteasy" },
  { name: "rhr", label: "konveyor.io/target=rhr" },
  { name: "azure-appservice", label: "konveyor.io/target=azure-appservice" },
];

const proprietaryTargets = [
  {
    name: "konveyor.io/target=azure-aks",
    label: "konveyor.io/target=azure-aks",
  },
];

export const defaultTargets =
  APP_BRAND === BrandType.Konveyor
    ? [...openTargets, ...proprietaryTargets]
    : [...openTargets];
