import { APP_BRAND, BrandType } from "@app/Constants";

const openTargets: string[] = [
  "konveyor.io/target=camel",
  "konveyor.io/target=cloud-readiness",
  "konveyor.io/target=drools",
  "konveyor.io/target=eap",
  "konveyor.io/target=eap6",
  "konveyor.io/target=eap7",
  "konveyor.io/target=eap8",
  "konveyor.io/target=eapxp",
  "konveyor.io/target=fsw",
  "konveyor.io/target=fuse",
  "konveyor.io/target=hibernate",
  "konveyor.io/target=hibernate-search",
  "konveyor.io/target=jakarta-ee",
  "konveyor.io/target=java-ee",
  "konveyor.io/target=jbpm",
  "konveyor.io/target=linux",
  "konveyor.io/target=openjdk",
  "konveyor.io/target=openjdk11",
  "konveyor.io/target=openjdk17",
  "konveyor.io/target=openliberty",
  "konveyor.io/target=quarkus",
  "konveyor.io/target=resteasy",
  "konveyor.io/target=rhr",
  "konveyor.io/target=azure-appservice",
];

const proprietaryTargets = ["konveyor.io/target=azure-aks"];

export const defaultTargets =
  APP_BRAND === BrandType.Konveyor
    ? [...openTargets, ...proprietaryTargets]
    : [...openTargets];
