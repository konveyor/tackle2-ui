import React from "react";
import { Button } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { saveAs } from "file-saver";

import { MimeType } from "@app/api/models";
import { useFetchStaticReport } from "@app/queries/applications";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { AxiosError } from "axios";
import { getAxiosErrorMessage } from "@app/utils/utils";

interface IDownloadButtonProps {
  id: number;
  mimeType: MimeType;
  children: React.ReactNode;
}

export const DownloadButton: React.FC<IDownloadButtonProps> = ({
  id,
  mimeType,
  children,
}) => {
  const { pushNotification } = React.useContext(NotificationsContext);

  const onFetchStaticReportError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { data: report, refetch } = useFetchStaticReport(
    id,
    mimeType,
    onFetchStaticReportError
  );

  const handleDownload = () => {
    refetch().then(() => {
      if (report) {
        saveAs(new Blob([report]), `analysis-report-app-${id}.${mimeType}`);
      }
    });
  };

  return (
    <Button
      key={mimeType}
      onClick={handleDownload}
      id={`download-${mimeType}-button`}
      variant="link"
      className={spacing.pXs}
    >
      {children}
    </Button>
  );
};

export default DownloadButton;
