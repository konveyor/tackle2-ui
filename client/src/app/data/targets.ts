import { APP_BRAND, BrandType } from "@app/Constants";

const openTargets: string[] = [
  "camel",
  "cloud-readiness",
  "drools",
  "eap",
  "eap6",
  "eap7",
  "eap8",
  "eapxp",
  "fsw",
  "fuse",
  "hibernate",
  "hibernate-search",
  "jakarta-ee",
  "java-ee",
  "jbpm",
  "linux",
  "openjdk",
  "openjdk11",
  "openjdk17",
  "openliberty",
  "quarkus",
  "resteasy",
  "rhr",
  "azure-appservice",
];

const proprietaryTargets = ["azure-aks"];

export const defaultTargets =
  APP_BRAND === BrandType.Konveyor
    ? [...openTargets, ...proprietaryTargets]
    : [...openTargets];
