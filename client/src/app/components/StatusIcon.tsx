import * as React from "react";
import { useTranslation } from "react-i18next";
import { Content, SpinnerProps } from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InProgressIcon,
  TimesCircleIcon,
  UnknownIcon,
} from "@patternfly/react-icons";
import {
  t_global_color_disabled_200 as disabledColor,
  t_global_color_status_danger_100 as errorColor,
  t_global_color_status_info_100 as infoColor,
  t_global_color_status_info_200 as loadingColor,
  t_global_color_status_success_100 as successColor,
  t_global_text_color_200 as unknownColor,
} from "@patternfly/react-tokens";

export type StatusIconType =
  | "Canceled"
  | "Completed"
  | "Error"
  | "Failed"
  | "InProgress"
  | "NotStarted"
  | "Ok"
  | "Scheduled"
  | "Unknown";

type IconListType = {
  [key in StatusIconType]: {
    Icon:
      | React.ComponentType<React.SVGProps<SVGSVGElement>>
      | React.FC<SpinnerProps>;
    color: { name: string; value: string; var: string };
  };
};
const iconList: IconListType = {
  Canceled: {
    Icon: TimesCircleIcon,
    color: infoColor,
  },
  Completed: {
    Icon: CheckCircleIcon,
    color: successColor,
  },
  Error: {
    Icon: ExclamationCircleIcon,
    color: errorColor,
  },
  Failed: {
    Icon: ExclamationCircleIcon,
    color: errorColor,
  },
  InProgress: {
    Icon: InProgressIcon,
    color: loadingColor,
  },
  NotStarted: {
    Icon: TimesCircleIcon,
    color: unknownColor,
  },
  Ok: {
    Icon: CheckCircleIcon,
    color: successColor,
  },
  Scheduled: {
    Icon: InProgressIcon,
    color: infoColor,
  },
  Unknown: {
    Icon: UnknownIcon,
    color: unknownColor,
  },
};

export interface IStatusIconProps {
  status: StatusIconType;
  isDisabled?: boolean;
  className?: string;
  label?: React.ReactNode | string;
}

export const StatusIcon: React.FC<IStatusIconProps> = ({
  status,
  isDisabled = false,
  className = "",
  label,
}: IStatusIconProps) => {
  const { t } = useTranslation();

  const Icon = iconList[status].Icon;
  const icon = (
    <Icon
      color={isDisabled ? disabledColor.value : iconList[status].color.value}
      className={className}
      isInline
    />
  );

  if (!label) {
    switch (status) {
      case "Canceled":
        label = t("terms.canceled");
        break;
      case "Completed":
        label = t("terms.completed");
        break;
      case "Error":
        label = t("terms.error");
        break;
      case "Failed":
        label = t("terms.failed");
        break;
      case "InProgress":
        label = t("terms.inProgress");
        break;
      case "NotStarted":
        label = t("terms.notStarted");
        break;
      case "Scheduled":
        label = t("terms.scheduled");
        break;
      default:
        label = t("terms.unknown");
        break;
    }
  }

  return (
    <Content>
      {icon} {label}
    </Content>
  );
};
