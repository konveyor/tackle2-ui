import React from "react";
import { Button } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useDownloadStaticReport } from "@app/queries/applications";
import { Application } from "@app/api/models";
import { Spinner, Alert } from "@patternfly/react-core";

import { MimeType } from "@app/api/models";

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
