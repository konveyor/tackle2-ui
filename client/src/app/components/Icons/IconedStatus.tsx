import React from "react";
import { Icon } from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import TimesCircleIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import InProgressIcon from "@patternfly/react-icons/dist/esm/icons/in-progress-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import UnknownIcon from "@patternfly/react-icons/dist/esm/icons/unknown-icon";
import TopologyIcon from "@patternfly/react-icons/dist/esm/icons/topology-icon";
import { IconWithLabel } from "./IconWithLabel";
import { ReactElement } from "react-markdown/lib/react-markdown";

export type IconedStatusPreset =
  | "InheritedReviews"
  | "InProgressInheritedReviews"
  | "InProgressInheritedAssessments"
  | "InheritedAssessments"
  | "Canceled"
  | "Completed"
  | "Error"
  | "Failed"
  | "InProgress"
  | "NotStarted"
  | "Ok"
  | "Scheduled"
  | "Unknown";

export type IconedStatusStatusType =
  | "custom"
  | "info"
  | "success"
  | "warning"
  | "danger";

type IconedStatusPresetType = {
  [key in IconedStatusPreset]: Omit<IIconedStatusProps, "preset"> & {
    topologyIcon?: ReactElement;
  };
};

export interface IIconedStatusProps {
  preset?: IconedStatusPreset;
  status?: IconedStatusStatusType;
  icon?: React.ReactNode;
  className?: string;
  label?: React.ReactNode | string;
  tooltipMessage?: string;
  tooltipCount?: number;
}

export const IconedStatus: React.FC<IIconedStatusProps> = ({
  preset,
  status,
  icon,
  className = "",
  label,
  tooltipCount = 0,
}: IIconedStatusProps) => {
  const { t } = useTranslation();
  const presets: IconedStatusPresetType = {
    InProgressInheritedReviews: {
      icon: <InProgressIcon />,
      status: "info",
      label: t("terms.inProgress"),
      tooltipMessage: t("message.inheritedReviewTooltip", {
        count: tooltipCount,
      }),
      topologyIcon: <TopologyIcon />,
    },
    InProgressInheritedAssessments: {
      icon: <InProgressIcon />,
      status: "info",
      label: t("terms.inProgress"),
      tooltipMessage: t("message.inheritedAssessmentTooltip", {
        count: tooltipCount,
      }),
      topologyIcon: <TopologyIcon />,
    },
    InheritedReviews: {
      icon: <CheckCircleIcon />,
      status: "success",
      label: t("terms.completed"),
      tooltipMessage: t("message.inheritedReviewTooltip", {
        count: tooltipCount,
      }),
      topologyIcon: <TopologyIcon />,
    },
    InheritedAssessments: {
      icon: <CheckCircleIcon />,
      status: "success",
      label: t("terms.completed"),
      tooltipMessage: t("message.inheritedAssessmentTooltip", {
        count: tooltipCount,
      }),
      topologyIcon: <TopologyIcon />,
    },
    Canceled: {
      icon: <TimesCircleIcon />,
      status: "info",
      label: t("terms.canceled"),
    },
    Completed: {
      icon: <CheckCircleIcon />,
      status: "success",
      label: t("terms.completed"),
    },
    Error: {
      icon: <ExclamationCircleIcon />,
      status: "danger",
      label: t("terms.error"),
    },
    Failed: {
      icon: <ExclamationCircleIcon />,
      status: "danger",
      label: t("terms.failed"),
    },
    InProgress: {
      icon: <InProgressIcon />,
      status: "info",
      label: t("terms.inProgress"),
    },
    NotStarted: {
      icon: <TimesCircleIcon />,
      label: t("terms.notStarted"),
    },
    Ok: {
      icon: <CheckCircleIcon />,
      status: "success",
    },
    Scheduled: {
      icon: <InProgressIcon />,
      status: "info",
      label: t("terms.scheduled"),
    },
    Unknown: {
      icon: <UnknownIcon />,
    },
  };
  const presetProps = preset && presets[preset];

  return (
    <IconWithLabel
      iconTooltipMessage={presetProps?.tooltipMessage}
      icon={
        <Icon status={status || presetProps?.status} className={className}>
          {icon || presetProps?.icon || <UnknownIcon />}
        </Icon>
      }
      label={label || presetProps?.label}
      trailingItemTooltipMessage={presetProps?.tooltipMessage}
      trailingItem={presetProps?.topologyIcon}
    />
  );
};
