import React from "react";
import {
  Alert,
  MultipleFileUpload,
  MultipleFileUploadMain,
  MultipleFileUploadStatus,
  MultipleFileUploadStatusItem,
} from "@patternfly/react-core";
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import useRuleFiles from "@app/hooks/useRuleFiles";
import { IReadFile } from "@app/api/models";
import { counting } from "radash";

export interface CustomRuleFilesUploadProps {
  /** Set of rule files that have already been uploaded. */
  ruleFiles: IReadFile[];

  onAddRuleFiles: (ruleFiles: IReadFile[]) => void;
  onRemoveRuleFiles: (ruleFiles: IReadFile[]) => void;
  onChangeRuleFile: (ruleFile: IReadFile) => void;

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
  onAddRuleFiles,
  onRemoveRuleFiles,
  onChangeRuleFile,
  fileExists,
  taskgroupId,
}) => {
  const { handleFileDrop, handleFile } = useRuleFiles({
    ruleFiles,
    fileExists,
    onAddRuleFiles,
    onRemoveRuleFiles,
    onChangeRuleFile,
    taskgroupId,
  });

  const showStatus = ruleFiles.length > 0;
  const filesInError = ruleFiles.filter((file) => !!file.loadError);

  const results = counting(ruleFiles, (r) => r.loadResult ?? "inProgress");

  const ruleFilesStatusText = `${results.success} of ${ruleFiles.length} files uploaded`;
  const ruleFilesStatusIcon =
    results.inProgress > 0
      ? "inProgress"
      : results.danger > 0
        ? "danger"
        : "success";

  return (
    <>
      {filesInError.map((file) => (
        <Alert
          key={file.fileName}
          className={`${spacing.mtMd} ${spacing.mbMd}`}
          variant="danger"
          isInline
          title={file.loadError?.message}
        />
      ))}

      <MultipleFileUpload
        onFileDrop={handleFileDrop}
        dropzoneProps={{
          accept: {
            "text/yaml": [".yml", ".yaml"],
          },
        }}
      >
        <MultipleFileUploadMain
          titleIcon={<UploadIcon />}
          titleText="Drag and drop files here"
          titleTextSeparator="or"
          infoText="Accepted file types: .yml, .yaml"
        />
        {showStatus && (
          <MultipleFileUploadStatus
            statusToggleText={ruleFilesStatusText}
            statusToggleIcon={ruleFilesStatusIcon}
          >
            {ruleFiles.map((ruleFile) => (
              <MultipleFileUploadStatusItem
                key={ruleFile.fileName}
                file={ruleFile.fullFile}
                customFileHandler={(file) => handleFile(ruleFile, file)}
                onClearClick={() => onRemoveRuleFiles([ruleFile])}
                progressValue={ruleFile.loadPercentage}
                progressVariant={ruleFile.loadResult}
              />
            ))}
          </MultipleFileUploadStatus>
        )}
      </MultipleFileUpload>
    </>
  );
};
