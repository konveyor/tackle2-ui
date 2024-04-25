import React from "react";
import { TimesCircleIcon, WarningTriangleIcon } from "@patternfly/react-icons";
import { IconedStatus } from "@app/components/Icons";

interface RiskIconProps {
  risk: string;
}

const RiskIcon: React.FC<RiskIconProps> = ({ risk }) => {
  switch (risk) {
    case "green":
      return <IconedStatus preset="Ok" />;
    case "red":
      return <IconedStatus icon={<TimesCircleIcon />} status="danger" />;
    case "yellow":
      return <IconedStatus icon={<WarningTriangleIcon />} status="warning" />;
    default:
      return <IconedStatus preset="Unknown" />;
  }
};

export default RiskIcon;
