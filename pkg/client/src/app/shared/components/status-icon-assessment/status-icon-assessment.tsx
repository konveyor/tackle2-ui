import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, FlexItem, SpinnerProps } from "@patternfly/react-core";
import { CheckCircleIcon } from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import { TimesCircleIcon } from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import { InProgressIcon } from "@patternfly/react-icons/dist/esm/icons/in-progress-icon";
import { SVGIconProps } from "@patternfly/react-icons/dist/js/createIcon";
import { ExclamationCircleIcon } from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import { UnknownIcon } from "@patternfly/react-icons/dist/esm/icons/unknown-icon";
import {
  global_disabled_color_200 as disabledColor,
  global_success_color_100 as successColor,
  global_Color_dark_200 as unknownColor,
  global_info_color_200 as loadingColor,
  global_danger_color_100 as errorColor,
  global_info_color_100 as infoColor,
} from "@patternfly/react-tokens";

export type StatusIconAssessmentType =
  | "Canceled"
  | "Completed"
  | "Failed"
  | "InProgress"
  | "NotStarted"
  | "Scheduled"
  | "Unknown";

type IconListType = {
  [key in StatusIconAssessmentType]: {
    Icon:
      | React.ComponentClass<SVGIconProps>
      | React.FunctionComponent<SpinnerProps>;
    color: { name: string; value: string; var: string };
  };
};
const iconList: IconListType = {
  NotStarted: {
    Icon: TimesCircleIcon,
    color: unknownColor,
  },
  InProgress: {
    Icon: InProgressIcon,
    color: loadingColor,
  },
  Completed: {
    Icon: CheckCircleIcon,
    color: successColor,
  },
  Scheduled: {
    Icon: InProgressIcon,
    color: infoColor,
  },
  Canceled: {
    Icon: TimesCircleIcon,
    color: infoColor,
  },
  Failed: {
    Icon: ExclamationCircleIcon,
    color: errorColor,
  },
  Unknown: {
    Icon: UnknownIcon,
    color: unknownColor,
  },
};

export interface IStatusIconAssessmentProps {
  status: StatusIconAssessmentType;
  isDisabled?: boolean;
  className?: string;
}

export const StatusIconAssessment: React.FunctionComponent<
  IStatusIconAssessmentProps
> = ({
  status,
  isDisabled = false,
  className = "",
}: IStatusIconAssessmentProps) => {
  const { t } = useTranslation();

  const Icon = iconList[status].Icon;
  const icon = (
    <Icon
      color={isDisabled ? disabledColor.value : iconList[status].color.value}
      className={className}
    />
  );

  let label: string;
  switch (status) {
    case "Canceled":
      label = t("terms.canceled");
      break;
    case "Completed":
      label = t("terms.completed");
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

  return (
    <Flex
      spaceItems={{ default: "spaceItemsSm" }}
      alignItems={{ default: "alignItemsCenter" }}
      flexWrap={{ default: "nowrap" }}
      style={{ whiteSpace: "nowrap" }}
      className={className}
    >
      <FlexItem>{icon}</FlexItem>
      <FlexItem>{label}</FlexItem>
    </Flex>
  );
};
