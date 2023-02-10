import migrationIcon from "@app/images/Icon-Red_Hat-Migration-A-Black-RGB.svg";
import appOnServerIcon from "@app/images/Icon-Red_Hat-App_on_server-A-Black-RGB.svg";
import cloudIcon from "@app/images/Icon-Red_Hat-Cloud-A-Black-RGB.svg";
import serverIcon from "@app/images/Icon-Red_Hat-Server-A-Black-RGB.svg";
import mugIcon from "@app/images/Icon-Red_Hat-Mug-A-Black-RGB.svg";
import multiplyIcon from "@app/images/Icon-Red_Hat-Multiply-A-Black-RGB.svg";
import virtualServerStackIcon from "@app/images/Icon-Red_Hat-Virtual_server_stack-A-Black-RGB.svg";
import { APP_BRAND, BrandType } from "@app/Constants";
import { MigrationTarget } from "@app/api/models";

const openTargets: string[] = [
  "camel",
  "cloud-readiness",
  "drools",
  "eap",
  "eap6",
  "eap7",
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

export const transformationTargets: MigrationTarget[] = [
  {
    name: "Application server migration to",
    description:
      "Upgrade to the latest Release of JBoss EAP or migrate your applications to JBoss EAP from other Enterprise Application Server (e.g. Oracle WebLogic Server).",
    options: [
      ["eap7", "JBoss EAP 7"],
      ["eap6", "JBoss EAP 6"],
    ],
    image: appOnServerIcon,
    custom: false,
  },
  {
    name: "Containerization",
    description:
      "A comprehensive set of cloud and container readiness rules to assess applications for suitability for deployment on Kubernetes.",
    options: [["cloud-readiness"]],
    image: cloudIcon,
    custom: false,
  },
  {
    name: "Quarkus",
    description:
      "Rules to support the migration of Spring Boot applications to Quarkus.",
    options: [["quarkus"]],
    image: migrationIcon,
    custom: false,
  },
  {
    name: "OracleJDK to OpenJDK",
    description: "Rules to support the migration to OpenJDK from OracleJDK.",
    options: [["openjdk"]],
    image: mugIcon,
    custom: false,
  },
  {
    name: "OpenJDK",
    description:
      "Rules to support upgrading the version of OpenJDK. Migrate to OpenJDK 11 or OpenJDK 17.",
    options: [
      ["openjdk11", "OpenJDK 11"],
      ["openjdk17", "OpenJDK 17"],
    ],
    image: mugIcon,
    custom: false,
  },
  {
    name: "Linux",
    description:
      "Ensure there are no Microsoft Windows paths hard coded into your applications.",
    options: [["linux"]],
    image: serverIcon,
    custom: false,
  },
  {
    name: "Jakarta EE 9",
    description:
      "A collection of rules to support migrating applications from Java EE 8 to Jakarta EE 9. The rules cover project dependencies, package renaming, updating XML Schema namespaces, the renaming of application configuration properties and bootstraping files.",
    options: [["jakarta-ee"]],
    image: migrationIcon,
    custom: false,
  },
  {
    name: "Spring Boot on Red Hat Runtimes",
    description:
      "A set of rules for assessing the compatibility of applications against the versions of Spring Boot libraries supported by Red Hat Runtimes.",
    options: [["rhr"]],
    image: migrationIcon,
    custom: false,
  },
  {
    name: "Open Liberty",
    description:
      "A comprehensive set of rulesfor migrating traditional WebSphere applications to Open Liberty.",
    options: [["openliberty"]],
    image: migrationIcon,
    custom: false,
  },
  {
    name: "Camel",
    description:
      "A comprehensive set of rules for migration from Apache Camel 2 to Apache Camel 3.",
    options: [["camel"]],
    image: multiplyIcon,
    custom: false,
  },
  {
    name: "Azure",
    description:
      "Upgrade your Java application so it can be deployed in different flavors of Azure.",
    options:
      APP_BRAND === BrandType.Konveyor
        ? [
            ["azure-appservice", "Azure App Service"],
            ["azure-aks", "Azure Kubernetes Service"],
          ]
        : [["azure-appservice", "Azure App Service"]],
    image: virtualServerStackIcon,
    // TODO for test purpose only, remove
    // custom: false,
    custom: true,
  },
];
