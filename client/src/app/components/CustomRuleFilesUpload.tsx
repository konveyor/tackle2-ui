import React from "react";
import {
  Alert,
  AlertActionCloseButton,
  MultipleFileUpload,
  MultipleFileUploadMain,
  MultipleFileUploadStatus,
  MultipleFileUploadStatusItem,
} from "@patternfly/react-core";
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import useRuleFiles from "@app/hooks/useRuleFiles";
import { IReadFile } from "@app/api/models";

export interface CustomRuleFilesUploadProps {
  /** Set of rule files that have already been uploaded. */
  ruleFiles: IReadFile[];

  /** Callback for when a file is added or removed.  Full set of files is always sent. */
  onChangeRuleFiles: (ruleFiles: IReadFile[]) => void;

  /** When provided, if a file name already exists, block the upload and display an error. */
  fileExists?: (filename: string) => boolean;

  /**
   * If working with custom rules in a Taskgroup (for Analysis), provide the taskgroup id.  Files
   * will be uploaded to the Taskgroup instead of a standard hub file.
   */
  taskgroupId?: number;
}

export const CustomRuleFilesUpload: React.FC<CustomRuleFilesUploadProps> = ({
  ruleFiles,
  onChangeRuleFiles,
  fileExists,
  taskgroupId,
}) => {
  const {
    handleFileDrop,
    handleFile,
    removeFiles,

    uploadError,
    clearUploadError,

    ruleFilesStatusText,
    ruleFilesStatusIcon,
  } = useRuleFiles({ ruleFiles, fileExists, onChangeRuleFiles, taskgroupId });

  const showStatus = ruleFiles.length > 0;

  return (
    <>
      {uploadError !== "" && (
        <Alert
          className={`${spacing.mtMd} ${spacing.mbMd}`}
          variant="danger"
          isInline
          title={uploadError}
          actionClose={
            <AlertActionCloseButton onClose={() => clearUploadError()} />
          }
        />
      )}

      <MultipleFileUpload
        onFileDrop={handleFileDrop}
        dropzoneProps={{
          accept: {
            "text/xml": [".xml"],
            "text/yaml": [".yml", ".yaml"],
          },
        }}
      >
        <MultipleFileUploadMain
          titleIcon={<UploadIcon />}
          titleText="Drag and drop files here"
          titleTextSeparator="or"
          infoText="Accepted file types: .yml, .yaml, .xml"
        />
        {showStatus && (
          <MultipleFileUploadStatus
            statusToggleText={ruleFilesStatusText}
            statusToggleIcon={ruleFilesStatusIcon}
          >
            {ruleFiles.map((file) => (
              <MultipleFileUploadStatusItem
                file={file.fullFile}
                key={file.fileName}
                customFileHandler={handleFile}
                onClearClick={() => removeFiles([file.fileName])}
                progressValue={file.loadPercentage}
                progressVariant={file.loadResult}
              />
            ))}
          </MultipleFileUploadStatus>
        )}
      </MultipleFileUpload>
    </>
  );
};
