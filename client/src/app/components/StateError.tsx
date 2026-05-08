import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
} from "@patternfly/react-core";
import { ExclamationCircleIcon } from "@patternfly/react-icons";
//  Color override removed after codemodes run
//  import {
//     t_temp_dev_tbd as globalDangerColor200 /* CODEMODS: you should update this color token, original v5 token was global_danger_color_200 */,
//  } from "@patternfly/react-tokens";

export const StateError: React.FC = () => {
  const { t } = useTranslation();
  return (
    <EmptyState
      headingLevel="h2"
      icon={ExclamationCircleIcon}
      titleText={t("message.unableToConnect")}
      variant={EmptyStateVariant.sm}
    >
      <EmptyStateBody>
        There was an error retrieving data. Check your connection and try again.
      </EmptyStateBody>
    </EmptyState>
  );
};
