import { useContext } from "react";
import { AxiosError } from "axios";
import { DropEvent } from "@patternfly/react-core";
import { load as loadYaml, YAMLException } from "js-yaml";

import { IReadFile } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useUploadFileTaskgroupMutation } from "@app/queries/taskgroups";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { useCreateFileMutation } from "@app/queries/targets";
import { checkRuleFileType } from "../utils/rules-utils";

export interface ValidationFunctionResult {
  state: "valid" | "error";
  message?: string;
}

const validateYamlFile = (data: string): ValidationFunctionResult => {
  try {
    loadYaml(data);
    return {
      state: "valid",
    };
  } catch (err) {
    const yamlException = err as YAMLException;
    return {
      state: "error",
      message: `${yamlException.reason} (ln: ${yamlException.mark.line}, col: ${yamlException.mark.column})`,
    };
  }
};

export interface UseRuleFilesParams {
  ruleFiles: IReadFile[];

  /**
   * Call back for when a set of files are dropped/uploaded via the hook's handleFileDrop().
   */
  onAddRuleFiles: (ruleFile: IReadFile[]) => void;

  /**
   * Callback when a file is removed.
   */
  onRemoveRuleFiles: (ruleFile: IReadFile[]) => void;

  /**
   * Callback for progress updates reading, validation, and uploading.  On success or fail, a final
   * change is made
   * @param ruleFile
   * @returns
   */
  onChangeRuleFile: (ruleFile: IReadFile) => void;

  /** Check if a file with fileName already exists.  If one already exists, upload fails. */
  fileExists?: (fileName: string) => boolean;

  taskgroupId?: number;
}

export interface UseRuleFilesValues {
  /**
   * Manage the set of files added/dropped on an upload component. Fires `onAddRuleFiles()`
   * and `onRemoveRuleFiles()` as needed. The component using this hook needs to use
   * `handleFile()` to manage accessing and basic validations of each file.
   */
  handleFileDrop: (_event: DropEvent, droppedFiles: File[]) => void;

  /**
   * Handle reading a file into the browser app, basic validations of the contents, and posting
   * the contents to hub.  Progress is pushed via calls to `onChangeRuleFile()`.
   */
  handleFile: (ruleFile: IReadFile, file: File) => void;
}

export default function useRuleFiles({
  ruleFiles,
  onAddRuleFiles,
  onRemoveRuleFiles,
  onChangeRuleFile,
  fileExists,
  taskgroupId,
}: UseRuleFilesParams): UseRuleFilesValues {
  const { pushNotification } = useContext(NotificationsContext);

  const notifyOnUploadFail = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: createRuleFile } = useCreateFileMutation((response, file) => {
    const ruleFile = ruleFiles.find(({ fileName }) => fileName === file.name);
    if (!ruleFile) return;

    onChangeRuleFile({
      ...ruleFile,
      responseID: response.id,
    });
  }, notifyOnUploadFail);

  const { mutate: uploadTaskgroupFile } = useUploadFileTaskgroupMutation(
    (response, { file }) => {
      const ruleFile = ruleFiles.find(({ fileName }) => fileName === file.name);
      if (!ruleFile) return;

      onChangeRuleFile({
        ...ruleFile,
        responseID: response.data.id,
      });
    },
    notifyOnUploadFail
  );

  const readFile = (ruleFile: IReadFile, file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.onprogress = (progressEvent) => {
        if (progressEvent.lengthComputable) {
          onChangeRuleFile({
            ...ruleFile,
            loadPercentage: (progressEvent.loaded / progressEvent.total) * 100,
          });
        }
      };
      reader.readAsText(file);
    });
  };

  const handleFileDrop = (_event: DropEvent, droppedFiles: File[]) => {
    // identify what, if any, files are re-uploads of already uploaded files
    const droppedFileNames = droppedFiles.map(({ name }) => name);
    const ruleFilesToRemove = ruleFiles.filter(({ fileName }) =>
      droppedFileNames.includes(fileName)
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
        const newRuleFiles: IReadFile[] = droppedFiles.map((droppedFile) => ({
          fileName: droppedFile.name,
          fullFile: droppedFile,
        }));
        onAddRuleFiles(newRuleFiles);
      });
  };

  const handleFile = (ruleFile: IReadFile, file: File) => {
    // Don't do anything for a File that already loaded or is just a
    // placeholder for an existing hub file
    if (
      ruleFile.loadResult === "success" ||
      ruleFile.loadPercentage === 100 ||
      file.type === "placeholder"
    ) {
      return;
    }

    readFile(ruleFile, file)
      .then(async (fileContents) => {
        console.log("successfully read", file.name);
        ruleFile.loadPercentage = 100;

        // Block duplicate file name uploads
        if (fileExists?.(file.name)) {
          throw new Error(`File "${file.name}" is already uploaded`);
        }

        // Verify/lint the contents of a YAML file
        if (checkRuleFileType(file.name) === "YAML") {
          const result = validateYamlFile(fileContents);
          if (result.state === "error") {
            throw new Error(
              `File "${file.name}" is not valid YAML: ${result.message}`
            );
          }
        }

        handleReadSuccess(ruleFile, file, fileContents);
      })
      .catch((error) => {
        handleReadFail(ruleFile, file, error);
      });
  };

  const handleReadSuccess = (ruleFile: IReadFile, file: File, data: string) => {
    console.log("reading SUCCESS", file.name);
    const newFile: IReadFile = {
      ...ruleFile,
      data,
      fullFile: file,
      loadResult: "success",
      loadPercentage: 100,
    };

    if (taskgroupId) {
      uploadTaskgroupFile({
        id: taskgroupId,
        path: `rules/${newFile.fileName}`,
        file,
      });
    } else {
      createRuleFile({ file });
    }

    // Note: The ruleFile will be updated by the onSuccess handlers of the mutations
  };

  const handleReadFail = (ruleFile: IReadFile, file: File, error: Error) => {
    console.log("reading FAIL", file.name, ", Error: ", error.message);
    const fileWithErrorState: IReadFile = {
      ...ruleFile,
      fullFile: file,
      loadResult: "danger",
      loadError: error,
    };
    onChangeRuleFile(fileWithErrorState);
  };

  return {
    handleFileDrop,
    handleFile,
  };
}
