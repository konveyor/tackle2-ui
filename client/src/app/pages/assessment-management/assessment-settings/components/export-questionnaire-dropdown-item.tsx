import * as React from "react";
import { useTranslation } from "react-i18next";
import { DropdownItem } from "@patternfly/react-core";

import { useDownloadQuestionnaire } from "@app/queries/questionnaires";

export interface IExportQuestionnaireDropdownItemProps {
  id: number;
}
export const ExportQuestionnaireDropdownItem: React.FC<
  IExportQuestionnaireDropdownItemProps
> = ({ id }) => {
  const { t } = useTranslation();
  const { mutate: downloadFile } = useDownloadQuestionnaire();

  const handleDownload = () => {
    downloadFile(id);
  };

  return (
    <DropdownItem key="export" component="button" onClick={handleDownload}>
      {t("actions.export")}
    </DropdownItem>
  );
};
