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

import { UploadFile } from "@app/api/models";
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
            uploadProgress: (progressEvent.loaded / progressEvent.total) * 100,
          });
        }
      };
      reader.readAsText(file);
    });
  };

  const readVerifyAndUploadFile = (ruleFile: UploadFile, file: File) => {
    // Don't do anything for a File that is already uploaded or is just a
    // placeholder for an existing hub file
    if (
      ruleFile.status === "exists" || // TODO: check this check, maybe status !== "starting"
      ruleFile.uploadProgress === 100 ||
      file.type === "placeholder"
    ) {
      return;
    }

    // Block duplicate file name uploads
    if (fileExists?.(file.name)) {
      onChangeRuleFile({
        ...ruleFile,
        loadError: `File "${file.name}" is already uploaded`,
        status: "failed",
      });
      return;
    }

    readFile(ruleFile, file)
      .then(async (fileContents) => {
        onChangeRuleFile({ ...ruleFile, uploadProgress: 100, status: "read" });

        // Verify/lint the contents of a YAML file
        if (checkRuleFileType(file.name) === "YAML") {
          const result = validateYamlFile(fileContents);
          if (result.state === "error") {
            throw new Error(
              `File "${file.name}" is not valid YAML: ${result.message}`
            );
          }
        }
        onChangeRuleFile({ ...ruleFile, status: "validated" });

        // Upload the file!  Note: The ruleFile is updated by the onSuccess handlers of the mutation
        uploadFile(file, taskgroupId);
      })
      .catch((error) => {
        console.log("reading FAIL", file.name, ", Error: ", error.message);
        onChangeRuleFile({
          ...ruleFile,
          loadError: error.message,
          status: "failed",
        });
      });
  };

  const { uploadFile } = useFileUploader(
    (file) => {
      onChangeRuleFile({
        ...ruleFileByName(file.name)!,
        uploadProgress: 100,
        status: "uploaded",
      });
    },
    (error, file) => {
      const msg = getAxiosErrorMessage(error);

      onChangeRuleFile({
        ...ruleFileByName(file.name)!,
        loadError: msg,
        status: "failed",
      });

      pushNotification({ title: msg, variant: "danger" });
    }
  );
  // <---- upload file handling

  const removeFile = (toRemove: UploadFile) => {
    // TODO: The file also be deleted (from HUB or from the taskgroup)
    // useRemoveUploadedFileMutation()

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
  onSuccess: (file: File) => void,
  onError: (e: AxiosError, file: File) => void
) {
  const { mutate: createRuleFile } = useCreateFileMutation(
    (_, file) => onSuccess(file),
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
