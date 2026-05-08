import * as React from "react";
import { useTranslation } from "react-i18next";
import { Content } from "@patternfly/react-core";

export interface EmptyTextMessageProps {
  message?: string;
}

export const EmptyTextMessage: React.FC<EmptyTextMessageProps> = ({
  message,
}) => {
  const { t } = useTranslation();

  return (
    <Content
      component="p"
      className="pf-v5-u-color-200 pf-v5-u-font-weight-light"
    >
      <i>{message || t("terms.notAvailable")}</i>
    </Content>
  );
};
