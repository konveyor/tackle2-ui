import React, { useState } from "react";
import { Alert, Button } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { Application } from "@app/api/models";
import { Spinner } from "@patternfly/react-core";
import { useDownloadStaticReport } from "@app/queries/download";

export enum MimeType {
  TAR = "tar",
  YAML = "yaml",
}
function DownloadButton({
  application,
  mimeType,
}: {
  application: Application;
  mimeType: MimeType;
}) {
  const {
    mutate: downloadFile,
    isLoading,
    isError,
  } = useDownloadStaticReport();

  const handleDownload = () => {
    downloadFile({
      applicationId: application.id,
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
}

export default DownloadButton;
