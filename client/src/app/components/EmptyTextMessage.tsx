import * as React from "react";
import { useTranslation } from "react-i18next";

export interface EmptyTextMessageProps {
  message?: string;
}

export const EmptyTextMessage: React.FC<EmptyTextMessageProps> = ({
  message,
}) => {
  const { t } = useTranslation();

  return (
    <span className="pf-u-color-200 pf-u-font-weight-light">
      <i>{message || t("terms.notAvailable")}</i>
    </span>
  );
};
