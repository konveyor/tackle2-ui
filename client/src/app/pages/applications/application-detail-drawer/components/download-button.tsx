import * as React from "react";
import { Alert, Button, Spinner } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { Application, MimeType } from "@app/api/models";
import { useDownloadStaticReport } from "@app/queries/applications";

interface IDownloadButtonProps {
  application: Application;
  mimeType: MimeType;
  isDownloadEnabled?: boolean;
  children: React.ReactNode;
}
export const DownloadButton: React.FC<IDownloadButtonProps> = ({
  application,
  mimeType,
  children,
  isDownloadEnabled,
}) => {
  const {
    mutateAsync: downloadFile,
    isPending,
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
      {isPending ? (
        <Spinner size="sm" />
      ) : isError ? (
        <Alert variant="warning" isInline title={"Error downloading report"}>
          <p>{"An error has occurred. Try to download again."}</p>
        </Alert>
      ) : (
        <>
          <Button
            key={mimeType}
            onClick={handleDownload}
            id={`download-${mimeType}-button`}
            variant="link"
            className={spacing.pXs}
            isAriaDisabled={!isDownloadEnabled}
          >
            {children}
          </Button>
        </>
      )}
    </>
  );
};

export default DownloadButton;
