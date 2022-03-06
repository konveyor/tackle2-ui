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
  options: string | MultipleOptions[];
  icon?: React.ComponentType<any>;
  iconSrc?: string;
}

interface MultipleOptions {
  label: string;
  value: string;
  default: boolean;
}

const options: TransformationTargets[] = [
  {
    label: "Application server migration to",
    description:
      "Upgrade to the latest Release of JBoss EAP or migrate your applications to JBoss EAP from competitors' Enterprise Application Server (e.g. Oracle WebLogic Server).",
    options: [
      {
        label: "JBoss EAP 6",
        value: "eap6",
        default: false,
      },
      {
        label: "JBoss EAP 7",
        value: "eap7",
        default: true,
      },
    ],
    iconSrc: jbossLogo,
  },
  {
    label: "Containerization",
    description:
      "A comprehensive set of cloud and container readiness rules to assess applications for suitability for deployment on OpenShift Container Platform.",
    options: "cloud-readiness",
    iconSrc: openshiftLogo,
  },
  {
    label: "Linux",
    description:
      "Ensure there are no Microsoft Windows paths hard coded into your applications.",
    options: "linux",
    iconSrc: linuxLogo,
  },
  {
    label: "OpenJDK",
    description: "Rules to support the migration to OpenJDK from OracleJDK.",
    options: "openjdk",
    iconSrc: openjdkLogo,
  },
  {
    label: "Camel",
    description:
      "A comprehensive set of rules for migration from Apache Camel 2 to Apache Camel 3.",
    options: "camel",
    iconSrc: camelLogo,
  },
  {
    label: "Quarkus",
    description:
      "Rules to support the migration of Spring Boot applications to Quarkus.",
    options: "quarkus",
    iconSrc: quarkusLogo,
  },
  {
    label: "Spring Boot on Red Hat Runtimes",
    description:
      "A set of rules for assessing the compatibility of applications against the versions of Spring Boot libraries supported by Red Hat Runtimes.",
    options: "rhr",
    iconSrc: rhRuntimesLogo,
  },
];

export interface SelectCardGalleryProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export const SelectCardGallery: React.FC<SelectCardGalleryProps> = ({
  value,
  onChange,
}) => {
  // When Option is an array e.g. EAP Card then it has a default value
  // However the default value changes after the user selects the dropdown.
  // 'selected' will keep the last selected dropdown value so it doesn't go back to
  // the original 'default' value. Map<'card.label', 'last card's selected dropdown value'>()
  const [selected, setSelected] = useState<Map<string, string>>(new Map());

  const isCardSelected = (
    cardOptions: string | { label: string; value: string }[]
  ): boolean => {
    if (typeof cardOptions === "string") {
      return value.includes(cardOptions);
    } else {
      const keyValues = cardOptions.map((k) => k.value);
      return value.some((f) => keyValues.includes(f));
    }
  };

  const getCardValue = (card: TransformationTargets): string => {
    if (typeof card.options === "string") {
      return card.options;
    } else {
      const keyValues = card.options.map((k) => k.value);
      const intersection = value.filter((f) => keyValues.includes(f));
      return intersection.length > 0
        ? intersection[0]
        : selected.get(card.label) ||
            card.options.find((f) => f.default)?.value ||
            card.options[0].value;
    }
  };

  const handleOnCardChange = (
    isSelected: boolean,
    selectionValue: string,
    card: TransformationTargets
  ) => {
    const optionsValue: string[] = Array.isArray(card.options)
      ? card.options.map((f) => f.value)
      : [card.options];

    const newValue = value.filter((f) => !optionsValue.includes(f));
    if (isSelected) {
      onChange([...newValue, selectionValue]);
    } else {
      onChange(newValue);
    }

    setSelected((previous) =>
      new Map(previous).set(card.label, selectionValue)
    );
  };

  options.map((item) => console.log(item.options));

  return (
    <Gallery hasGutter>
      {options.map((elem, index) => (
        <GalleryItem key={index}>
          <SelectCard
            item={elem}
            isSelected={isCardSelected(elem.options)}
            value={getCardValue(elem)}
            onChange={(isSelected: boolean, selectionValue: string) => {
              handleOnCardChange(isSelected, selectionValue, elem);
            }}
          />
        </GalleryItem>
      ))}
    </Gallery>
  );
};
