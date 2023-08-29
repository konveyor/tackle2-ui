import axios from "axios";
import { saveAs } from "file-saver";
import { APPLICATIONS } from "@app/api/rest";
import { useMutation } from "@tanstack/react-query";
import { MimeType } from "@app/pages/applications/components/application-detail-drawer/components/download-button";

interface DownloadOptions {
  applicationId: number;
  mimeType: MimeType;
}

export const downloadStaticReport = async ({
  applicationId,
  mimeType,
}: DownloadOptions): Promise<void> => {
  let acceptHeader = "application/x-tar";

  switch (mimeType) {
    case MimeType.YAML:
      acceptHeader = "application/x-yaml";
      break;
    case MimeType.TAR:
    default:
      acceptHeader = "application/x-tar";
  }

  try {
    const response = await axios.get(
      `${APPLICATIONS}/${applicationId}/analysis/report`,
      {
        responseType: "blob",
        headers: {
          Accept: acceptHeader,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Network response was not ok when downloading file.");
    }

    const blob = new Blob([response.data]);
    saveAs(
      blob,
      `analysis-report-app-${applicationId}.${acceptHeader.split("-")[1]}`
    );
  } catch (error) {
    console.error("There was an error downloading the file:", error);
    throw error;
  }
};

export const useDownloadStaticReport = () => {
  return useMutation(downloadStaticReport);
};
