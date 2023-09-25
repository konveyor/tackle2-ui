import * as React from "react";
import { saveAs } from "file-saver";
import { DropdownItem } from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

import { useFetchQuestionnaireBlob } from "@app/queries/questionnaires";
import { AxiosError } from "axios";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { NotificationsContext } from "@app/components/NotificationsContext";

export interface IExportQuestionnaireDropdownItemProps {
  id: number;
}
export const ExportQuestionnaireDropdownItem: React.FC<
  IExportQuestionnaireDropdownItemProps
> = ({ id }) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const onExportQuestionnaireError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { data: questionnaire, refetch } = useFetchQuestionnaireBlob(
    id,
    onExportQuestionnaireError
  );

  const exportQuestionnaire = () => {
    refetch().then(() => {
      if (questionnaire) {
        saveAs(new Blob([questionnaire]), `questionnaire-${id}.yaml`);
      }
    });
  };

  return (
    <DropdownItem key="export" component="button" onClick={exportQuestionnaire}>
      {t("actions.export")}
    </DropdownItem>
  );
};
