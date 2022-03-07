import React, { useState } from "react";
import { Gallery, GalleryItem } from "@patternfly/react-core";

import { SelectCard } from "./select-card";

import jbossLogo from "@app/images/jboss.svg";
import openshiftLogo from "@app/images/openshift.svg";
import linuxLogo from "@app/images/linux.svg";
import openjdkLogo from "@app/images/openjdk.svg";
import camelLogo from "@app/images/camel.svg";
import quarkusLogo from "@app/images/quarkus.svg";
import rhRuntimesLogo from "@app/images/rh-runtimes.svg";

export interface TransformationTargets {
  label: string;
  description?: string;
  options: Map<string, string>;
  icon?: React.ComponentType<any>;
  iconSrc?: string;
}

const options: TransformationTargets[] = [
  {
    label: "Application server migration to",
    description:
      "Upgrade to the latest Release of JBoss EAP or migrate your applications to JBoss EAP from competitors' Enterprise Application Server (e.g. Oracle WebLogic Server).",
    options: new Map([
      ["eap7", "JBoss EAP 7"],
      ["eap6", "JBoss EAP 6"],
    ]),
    iconSrc: jbossLogo,
  },
  {
    label: "Containerization",
    description:
      "A comprehensive set of cloud and container readiness rules to assess applications for suitability for deployment on OpenShift Container Platform.",
    options: new Map([["cloud-readiness", "cloud-readiness"]]),
    iconSrc: openshiftLogo,
  },
  {
    label: "Linux",
    description:
      "Ensure there are no Microsoft Windows paths hard coded into your applications.",
    options: new Map([["linux", "linux"]]),
    iconSrc: linuxLogo,
  },
  {
    label: "OpenJDK",
    description: "Rules to support the migration to OpenJDK from OracleJDK.",
    options: new Map([["openjdk", "openjdk"]]),
    iconSrc: openjdkLogo,
  },
  {
    label: "Camel",
    description:
      "A comprehensive set of rules for migration from Apache Camel 2 to Apache Camel 3.",
    options: new Map([["camel", "camel"]]),
    iconSrc: camelLogo,
  },
  {
    label: "Quarkus",
    description:
      "Rules to support the migration of Spring Boot applications to Quarkus.",
    options: new Map([["quarkus", "quarkus"]]),
    iconSrc: quarkusLogo,
  },
  {
    label: "Spring Boot on Red Hat Runtimes",
    description:
      "A set of rules for assessing the compatibility of applications against the versions of Spring Boot libraries supported by Red Hat Runtimes.",
    options: new Map([["rhr", "rhr"]]),
    iconSrc: rhRuntimesLogo,
  },
];

export interface SelectCardGalleryProps {
  values: string[];
  onChange: (value: string[]) => void;
}

export const SelectCardGallery: React.FC<SelectCardGalleryProps> = ({
  values,
  onChange,
}) => {
  const [CardsSelected, setCardsSelected] = React.useState();

  const handleOnCardChange = (
    isNewCard: boolean,
    selectionValue: string,
    card: TransformationTargets
  ) => {
    const selectedTargets = values.filter(
      (target) => !card.options.has(target)
    );

    if (isNewCard) onChange([...selectedTargets, selectionValue]);
    else onChange(selectedTargets);
  };

  return (
    <Gallery hasGutter>
      {options.map((elem, index) => (
        <GalleryItem key={index}>
          <SelectCard
            item={elem}
            onChange={(isNewCard: boolean, selectionValue: string) => {
              handleOnCardChange(isNewCard, selectionValue, elem);
            }}
          />
        </GalleryItem>
      ))}
    </Gallery>
  );
};
