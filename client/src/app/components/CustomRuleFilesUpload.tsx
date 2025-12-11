import { type FC, useContext, useRef } from "react";
import { AxiosError } from "axios";
import { counting } from "radash";
import {
  Alert,
  DropEvent,
  MultipleFileUpload,
  MultipleFileUploadMain,
  MultipleFileUploadStatus,
  MultipleFileUploadStatusItem,
} from "@patternfly/react-core";
import { UploadIcon } from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { HubFile, UploadFile } from "@app/api/models";
import { useCreateFileMutation } from "@app/queries/targets";
import { useUploadTaskgroupFileMutation } from "@app/queries/taskgroups";
import { checkRuleFileType, validateYamlFile } from "@app/utils/rules-utils";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { NotificationsContext } from "./NotificationsContext";

const readFile = (
  file: File,
  onProgress: (status: "reading" | "read", percent: number) => void
) => {
  return new Promise<string>((resolve, reject) => {
    onProgress("reading", 0);

    const reader = new FileReader();
    reader.onload = () => {
      onProgress("read", 1.0);
      resolve(reader.result as string);
    };
    reader.onerror = () => reject(reader.error);
    reader.onprogress = (progressEvent) => {
      if (progressEvent.lengthComputable) {
        onProgress("reading", progressEvent.loaded / progressEvent.total);
      }
    };
    reader.readAsText(file);
  });
};

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

export const CustomRuleFilesUpload: FC<CustomRuleFilesUploadProps> = ({
  ruleFiles,
  onAddRuleFiles,
  onRemoveRuleFiles,
  onChangeRuleFile,
  fileExists,
  taskgroupId,
}) => {
  const { pushNotification } = useContext(NotificationsContext);

  const { uploadFile } = useFileUploader(
    (file, hubFile, ruleFileContext) => {
      if (ruleFileContext) {
        onChangeRuleFile({
          ...ruleFileContext,
          fileId: hubFile?.id,
          uploadProgress: 100,
          status: "uploaded",
        });
      }
    },
    (error, file, ruleFileContext) => {
      const msg = getAxiosErrorMessage(error);

      if (ruleFileContext) {
        onChangeRuleFile({
          ...ruleFileContext,
          loadError: msg,
          status: "failed",
        });
      }

      pushNotification({ title: msg, variant: "danger" });
    }
  );
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

  const readVerifyAndUploadFile = async (ruleFile: UploadFile, file: File) => {
    if (["exists", "uploaded", "failed"].includes(ruleFile.status)) {
      return;
    }

    try {
      if (fileExists?.(file.name)) {
        throw new Error(`File "${file.name}" is already uploaded`);
      }

      const fileContents = await readFile(file, (status, readPercent) => {
        onChangeRuleFile({
          ...ruleFile,
          status,
          uploadProgress: Math.round(10 * readPercent), // first 10% is reading the file
        });
      });

      // Verify/lint the contents of a YAML file
      if (checkRuleFileType(file.name) === "YAML") {
        const result = validateYamlFile(fileContents);
        if (result.state === "error") {
          throw new Error(
            `File "${file.name}" is not valid YAML: ${result.message}`
          );
        }
      }
      const updatedRuleFile: UploadFile = {
        ...ruleFile,
        uploadProgress: 20, // second 10% is validating the file
        status: "validated",
        contents: fileContents,
      };
      onChangeRuleFile(updatedRuleFile);

      // TODO: Provide an onUploadProgress handler so the actual upload can be tracked from 20% to 100%
      uploadFile(file, taskgroupId, updatedRuleFile);
    } catch (error) {
      onChangeRuleFile({
        ...ruleFile,
        loadError: (error as Error).message,
        status: "failed",
      });
    }
  };

  const removeUploadedFile = (toRemove: UploadFile) => {
    onRemoveRuleFiles([toRemove]);
    // TODO: Remove the file from hub
  };
  // <---- upload file handling

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
                onClearClick={() => removeUploadedFile(ruleFile)}
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
  onSuccess: (
    file: File,
    hubFile?: HubFile,
    ruleFileContext?: UploadFile
  ) => void,
  onError: (e: AxiosError, file: File, ruleFileContext?: UploadFile) => void
) {
  // Store file context to pass to callbacks
  const fileContextRef = useRef(new Map<string, UploadFile>());

  const { mutate: createRuleFile } = useCreateFileMutation(
    (hubFile, file) => {
      const ruleFileContext = fileContextRef.current.get(file.name);
      onSuccess(file, hubFile, ruleFileContext);
      fileContextRef.current.delete(file.name);
    },
    (e, file) => {
      const ruleFileContext = fileContextRef.current.get(file.name);
      onError(e, file, ruleFileContext);
      fileContextRef.current.delete(file.name);
    }
  );

  const { mutate: uploadTaskgroupFile } = useUploadTaskgroupFileMutation(
    (_, { file }) => {
      const ruleFileContext = fileContextRef.current.get(file.name);
      onSuccess(file, undefined, ruleFileContext);
      fileContextRef.current.delete(file.name);
    },
    (e, { file }) => {
      const ruleFileContext = fileContextRef.current.get(file.name);
      onError(e, file, ruleFileContext);
      fileContextRef.current.delete(file.name);
    }
  );

  const uploadFile = (
    file: File,
    taskgroupId?: number,
    ruleFileContext?: UploadFile
  ) => {
    // Store the ruleFile context for retrieval in callbacks
    if (ruleFileContext) {
      fileContextRef.current.set(file.name, ruleFileContext);
    }

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
