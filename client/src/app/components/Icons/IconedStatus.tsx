import React from "react";
import { Icon } from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { IconWithLabel } from "./IconWithLabel";
import { ReactElement } from "react-markdown/lib/react-markdown";

import {
  CheckCircleIcon,
  TimesCircleIcon,
  InProgressIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  UnknownIcon,
  TopologyIcon,
} from "@patternfly/react-icons";
import { buildPresetLabels } from "@app/pages/applications/components/application-analysis-status";

export type IconedStatusPreset =
  | "InheritedReviews"
  | "InProgressInheritedReviews"
  | "InProgressInheritedAssessments"
  | "InheritedAssessments"
  | "Canceled"
  | "Completed"
  | "CompletedWithErrors"
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
  const messages = buildPresetLabels(t);
  const presets: IconedStatusPresetType = {
    InProgressInheritedReviews: {
      icon: <InProgressIcon />,
      status: "info",
      label: messages.InProgressInheritedReviews.label,
      tooltipMessage: t("message.inheritedReviewTooltip", {
        count: tooltipCount,
      }),
      topologyIcon: <TopologyIcon />,
    },
    InProgressInheritedAssessments: {
      icon: <InProgressIcon />,
      status: "info",
      label: messages.InProgressInheritedAssessments.label,
      tooltipMessage: t("message.inheritedAssessmentTooltip", {
        count: tooltipCount,
      }),
      topologyIcon: <TopologyIcon />,
    },
    InheritedReviews: {
      icon: <CheckCircleIcon />,
      status: "success",
      label: messages.InheritedReviews.label,
      tooltipMessage: t("message.inheritedReviewTooltip", {
        count: tooltipCount,
      }),
      topologyIcon: <TopologyIcon />,
    },
    InheritedAssessments: {
      icon: <CheckCircleIcon />,
      status: "success",
      label: messages.InheritedAssessments.label,
      tooltipMessage: t("message.inheritedAssessmentTooltip", {
        count: tooltipCount,
      }),
      topologyIcon: <TopologyIcon />,
    },
    Canceled: {
      icon: <TimesCircleIcon />,
      status: "info",
      label: messages.Canceled.label,
    },
    Completed: {
      icon: <CheckCircleIcon />,
      status: "success",
      label: messages.Completed.label,
    },
    CompletedWithErrors: {
      icon: <ExclamationTriangleIcon />,
      status: "warning",
      label: messages.CompletedWithErrors.label,
    },
    Error: {
      icon: <ExclamationCircleIcon />,
      status: "danger",
      label: messages.Error.label,
    },
    Failed: {
      icon: <ExclamationCircleIcon />,
      status: "danger",
      label: messages.Failed.label,
    },
    InProgress: {
      icon: <InProgressIcon />,
      status: "info",
      label: messages.InProgress.label,
    },
    NotStarted: {
      icon: <TimesCircleIcon />,
      label: messages.NotStarted.label,
    },
    Ok: {
      icon: <CheckCircleIcon />,
      status: "success",
    },
    Scheduled: {
      icon: <InProgressIcon />,
      status: "info",
      label: messages.Scheduled.label,
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
