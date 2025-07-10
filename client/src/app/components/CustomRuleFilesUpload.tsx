import React, { useContext } from "react";
import { AxiosError } from "axios";
import {
  Alert,
  DropEvent,
  MultipleFileUpload,
  MultipleFileUploadMain,
  MultipleFileUploadStatus,
  MultipleFileUploadStatusItem,
} from "@patternfly/react-core";
import { counting } from "radash";
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { HubFile, UploadFile } from "@app/api/models";
import { useCreateFileMutation } from "@app/queries/targets";
import { useUploadTaskgroupFileMutation } from "@app/queries/taskgroups";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { checkRuleFileType, validateYamlFile } from "@app/utils/rules-utils";
import { NotificationsContext } from "./NotificationsContext";

export interface CustomRuleFilesUploadProps {
  /** Set of rule files that have already been uploaded. */
  ruleFiles: UploadFile[];

  /**
   * Callback for when one or more files are added/dropped to be uploaded.
   */
  onAddRuleFiles: (ruleFiles: UploadFile[]) => void;

  /**
   * Callback when a file is removed directly or replaced with a new upload of the same name.
   */
  onRemoveRuleFiles: (ruleFiles: UploadFile[]) => void;

  /**
   * Callback for when a file's information has changed (progress indicator, status)
   */
  onChangeRuleFile: (ruleFile: UploadFile) => void;

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
  const { pushNotification } = useContext(NotificationsContext);
  const ruleFileByName = (fn: string) =>
    ruleFiles.find((r) => r.fileName === fn);

  // -----> upload file handling
  const setupFilesToUpload = (_event: DropEvent, incomingFiles: File[]) => {
    // identify what, if any, files are re-uploads of already uploaded files
    const incomingFileNames = incomingFiles.map(({ name }) => name);
    const ruleFilesToRemove = ruleFiles.filter(({ fileName }) =>
      incomingFileNames.includes(fileName)
    );

    // this promise chain is needed because if the file removal is done at the same time as the
    // file adding react won't realize that the status items for the re-uploaded files needs to
    // be re-rendered
    Promise.resolve()
      .then(
        () =>
          ruleFilesToRemove.length > 0 && onRemoveRuleFiles(ruleFilesToRemove)
      )
      .then(() => {
        const newRuleFiles: UploadFile[] = incomingFiles.map((file) => ({
          fileName: file.name,
          fullFile: file,
          uploadProgress: 0,
          status: "starting",
        }));
        onAddRuleFiles(newRuleFiles);
      });
  };

  const readFile = (ruleFile: UploadFile, file: File) => {
    return new Promise<string>((resolve, reject) => {
      onChangeRuleFile({ ...ruleFile, status: "reading" });

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.onprogress = (progressEvent) => {
        if (progressEvent.lengthComputable) {
          onChangeRuleFile({
            ...ruleFile,
            uploadProgress: (progressEvent.loaded / progressEvent.total) * 10,
          });
        }
      };
      reader.readAsText(file);
    });
  };

  const readVerifyAndUploadFile = (ruleFile: UploadFile, file: File) => {
    if (["exists", "uploaded", "failed"].includes(ruleFile.status)) {
      return;
    }

    Promise.resolve()
      .then(() => {
        if (fileExists?.(file.name)) {
          throw new Error(`File "${file.name}" is already uploaded`);
        }
      })
      .then(() => readFile(ruleFile, file))
      .then(async (fileContents) => {
        onChangeRuleFile({ ...ruleFile, uploadProgress: 10, status: "read" });

        // Verify/lint the contents of a YAML file
        if (checkRuleFileType(file.name) === "YAML") {
          const result = validateYamlFile(fileContents);
          if (result.state === "error") {
            throw new Error(
              `File "${file.name}" is not valid YAML: ${result.message}`
            );
          }
        }
        onChangeRuleFile({
          ...ruleFile,
          uploadProgress: 20,
          status: "validated",
          contents: fileContents,
        });

        // Upload the file to hub!
        // TODO: Provide an onUploadProgress handler so the actual upload can be tracked from 20% to 100%
        uploadFile(file, taskgroupId);
      })
      .catch((error) => {
        onChangeRuleFile({
          ...ruleFile,
          loadError: error.message,
          status: "failed",
        });
      });
  };

  const { uploadFile } = useFileUploader(
    (file, hubFile) => {
      const ruleFile = ruleFileByName(file.name);
      if (ruleFile) {
        onChangeRuleFile({
          ...ruleFile,
          id: hubFile?.id,
          uploadProgress: 100,
          status: "uploaded",
        });
      }
    },
    (error, file) => {
      const msg = getAxiosErrorMessage(error);

      const ruleFile = ruleFileByName(file.name);
      if (ruleFile) {
        onChangeRuleFile({
          ...ruleFile,
          loadError: msg,
          status: "failed",
        });
      }

      pushNotification({ title: msg, variant: "danger" });
    }
  );
  // <---- upload file handling

  const removeFile = (toRemove: UploadFile) => {
    onRemoveRuleFiles([toRemove]);
  };

  const showStatus = ruleFiles.length > 0;
  const filesInError = ruleFiles.filter((file) => !!file.loadError);

  const statuses = counting(ruleFiles, (r) => r.status);
  const successCount = (statuses.exists ?? 0) + (statuses.uploaded ?? 0);

  const ruleFilesStatusText = `${successCount} of ${ruleFiles.length} files uploaded`;
  const ruleFilesStatusIcon: "danger" | "success" | "inProgress" =
    successCount === ruleFiles.length
      ? "success"
      : (statuses.failed ?? 0) > 0
        ? "danger"
        : "inProgress";

  const progressVariant = (rf: UploadFile) => {
    return rf.status === "failed" ? "danger" : "success";
  };

  return (
    <>
      {filesInError.map((file) => (
        <Alert
          key={file.fileName}
          className={`${spacing.mtMd} ${spacing.mbMd}`}
          variant="danger"
          isInline
          title={file.loadError}
        />
      ))}

      <MultipleFileUpload
        onFileDrop={setupFilesToUpload}
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
                customFileHandler={(file) =>
                  readVerifyAndUploadFile(ruleFile, file)
                }
                onClearClick={() => removeFile(ruleFile)}
                progressValue={ruleFile.uploadProgress}
                progressVariant={progressVariant(ruleFile)}
              />
            ))}
          </MultipleFileUploadStatus>
        )}
      </MultipleFileUpload>
    </>
  );
};

function useFileUploader(
  onSuccess: (file: File, hubFile?: HubFile) => void,
  onError: (e: AxiosError, file: File) => void
) {
  const { mutate: createRuleFile } = useCreateFileMutation(
    (hubFile, file) => onSuccess(file, hubFile),
    (e, file) => onError(e, file)
  );

  const { mutate: uploadTaskgroupFile } = useUploadTaskgroupFileMutation(
    (_, { file }) => onSuccess(file),
    (e, { file }) => onError(e, file)
  );

  const uploadFile = (file: File, taskgroupId?: number) => {
    if (taskgroupId === undefined) {
      createRuleFile({ file });
    } else {
      uploadTaskgroupFile({
        id: taskgroupId,
        path: `rules/${file.name}`,
        file,
      });
    }
  };

  return {
    uploadFile,
  };
}
