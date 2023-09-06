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
  const yamlAcceptHeader = "application/x-yaml";
  let url = `${APPLICATIONS}/${applicationId}/analysis/report`;

  switch (mimeType) {
    case MimeType.YAML:
      url = `${APPLICATIONS}/${applicationId}/analysis`;
      break;
    case MimeType.TAR:
    default:
      url = `${APPLICATIONS}/${applicationId}/analysis/report`;
  }

  try {
    const response = await axios.get(url, {
      responseType: "blob",
      ...(MimeType.YAML && {
        headers: {
          Accept: yamlAcceptHeader,
        },
      }),
    });

    if (response.status !== 200) {
      throw new Error("Network response was not ok when downloading file.");
    }

    const blob = new Blob([response.data]);
    saveAs(blob, `analysis-report-app-${applicationId}.${mimeType}`);
  } catch (error) {
    console.error("There was an error downloading the file:", error);
    throw error;
  }
};

export const useDownloadStaticReport = () => {
  return useMutation(downloadStaticReport);
};
