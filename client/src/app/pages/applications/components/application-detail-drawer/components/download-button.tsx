import React from "react";
import { Alert, Button } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { Spinner } from "@patternfly/react-core";
import { useDownloadStaticReport } from "@app/queries/applications";
import { Application } from "@app/api/models";

export enum MimeType {
  TAR = "tar",
  YAML = "yaml",
}
interface IDownloadButtonProps {
  application: Application;
  mimeType: MimeType;
}
export const DownloadButton: React.FC<IDownloadButtonProps> = ({
  application,
  mimeType,
}) => {
  const {
    mutate: downloadFile,
    isLoading,
    isError,
  } = useDownloadStaticReport();

  const handleDownload = () => {
    downloadFile({
      application: application,
      mimeType: mimeType,
    });
  };

  return (
    <>
      {isLoading ? (
        <Spinner size="sm" />
      ) : isError ? (
        <Alert variant="warning" isInline title={"Error downloading report"}>
          <p>{"An error has occurred. Try to download again."}</p>
        </Alert>
      ) : (
        <>
          <Button
            onClick={handleDownload}
            id={`download-${mimeType}-button`}
            variant="link"
            className={spacing.pXs}
          >
            {mimeType === MimeType.YAML ? "YAML" : "Report"}
          </Button>
        </>
      )}
    </>
  );
};

export default DownloadButton;
