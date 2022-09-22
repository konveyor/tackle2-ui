import React from "react";
import {
  Title,
  Stack,
  StackItem,
  TextContent,
  Text,
  Gallery,
  GalleryItem,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import migrationIcon from "@app/images/Icon-Red_Hat-Migration-A-Black-RGB.svg";
import appOnServerIcon from "@app/images/Icon-Red_Hat-App_on_server-A-Black-RGB.svg";
import cloudIcon from "@app/images/Icon-Red_Hat-Cloud-A-Black-RGB.svg";
import serverIcon from "@app/images/Icon-Red_Hat-Server-A-Black-RGB.svg";
import mugIcon from "@app/images/Icon-Red_Hat-Mug-A-Black-RGB.svg";
import multiplyIcon from "@app/images/Icon-Red_Hat-Multiply-A-Black-RGB.svg";

import { SelectCard } from "./components/select-card";
import { useFormContext } from "react-hook-form";

export interface TransformationTargets {
  label: string;
  description?: string;
  options: Map<string, string>;
  icon?: React.ComponentType<any>;
  iconSrc?: string;
}

export const SetTargets: React.FunctionComponent = () => {
  const { t } = useTranslation();

  const options: TransformationTargets[] = [
    {
      label: "Application server migration to",
      description:
        "Upgrade to the latest Release of JBoss EAP or migrate your applications to JBoss EAP from other Enterprise Application Server (e.g. Oracle WebLogic Server).",
      options: new Map([
        ["eap7", "JBoss EAP 7"],
        ["eap6", "JBoss EAP 6"],
      ]),
      iconSrc: appOnServerIcon,
    },
    {
      label: "Containerization",
      description:
        "A comprehensive set of cloud and container readiness rules to assess applications for suitability for deployment on Kubernetes.",
      options: new Map([["cloud-readiness", "cloud-readiness"]]),
      iconSrc: cloudIcon,
    },
    {
      label: "Quarkus",
      description:
        "Rules to support the migration of Spring Boot applications to Quarkus.",
      options: new Map([["quarkus", "quarkus"]]),
      iconSrc: migrationIcon,
    },
    {
      label: "OracleJDK to OpenJDK",
      description: "Rules to support the migration to OpenJDK from OracleJDK.",
      options: new Map([["openjdk", "openjdk"]]),
      iconSrc: mugIcon,
    },
    {
      label: "OpenJDK",
      description:
        "Rules to support upgrading the version of OpenJDK. Migrate to OpenJDK 11 or OpenJDK 17.",
      options: new Map([
        ["openjdk11", "openJDK 11"],
        ["openjdk17", "openJDK 17"],
      ]),
      iconSrc: mugIcon,
    },
    {
      label: "Linux",
      description:
        "Ensure there are no Microsoft Windows paths hard coded into your applications.",
      options: new Map([["linux", "linux"]]),
      iconSrc: serverIcon,
    },
    {
      label: "Jakarta EE 9",
      description:
        "A collection of rules to support migrating applications from Java EE 8 to Jakarta EE 9. The rules cover project dependencies, package renaming, updating XML Schema namespaces, the renaming of application configuration properties and bootstraping files.",
      options: new Map([["jakarta-ee", "jakarta-ee"]]),
      iconSrc: migrationIcon,
    },
    {
      label: "Spring Boot on Red Hat Runtimes",
      description:
        "A set of rules for assessing the compatibility of applications against the versions of Spring Boot libraries supported by Red Hat Runtimes.",
      options: new Map([["rhr", "rhr"]]),
      iconSrc: migrationIcon,
    },
    {
      label: "Open Liberty",
      description:
        "A comprehensive set of rulesfor migrating traditional WebSphere applications to Open Liberty.",
      options: new Map([["openliberty", "openliberty"]]),
      iconSrc: migrationIcon,
    },
    {
      label: "Camel",
      description:
        "A comprehensive set of rules for migration from Apache Camel 2 to Apache Camel 3.",
      options: new Map([["camel", "camel"]]),
      iconSrc: multiplyIcon,
    },
  ];

  const { getValues, setValue } = useFormContext();
  const targets: string[] = getValues("targets");

  const handleOnCardChange = (
    isNewCard: boolean,
    selectionValue: string,
    card: TransformationTargets
  ) => {
    const selectedTargets = targets.filter(
      (target) => !card.options.has(target)
    );

    if (isNewCard) setValue("targets", [...selectedTargets, selectionValue]);
    else setValue("targets", selectedTargets);
  };

  return (
    <>
      <TextContent>
        <Title headingLevel="h3" size="xl">
          {t("wizard.terms.setTargets")}
        </Title>
        <Text>{t("wizard.label.setTargets")}</Text>
      </TextContent>
      <Stack>
        <StackItem>
          <Gallery hasGutter>
            {options.map((elem, index) => (
              <GalleryItem key={index}>
                <SelectCard
                  item={elem}
                  cardSelected={[...elem.options.keys()].some((key) =>
                    targets.includes(key)
                  )}
                  onChange={(isNewCard: boolean, selectionValue: string) => {
                    handleOnCardChange(isNewCard, selectionValue, elem);
                  }}
                />
              </GalleryItem>
            ))}
          </Gallery>
        </StackItem>
      </Stack>{" "}
    </>
  );
};
