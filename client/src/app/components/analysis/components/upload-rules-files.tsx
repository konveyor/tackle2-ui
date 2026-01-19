import * as React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button, Modal } from "@patternfly/react-core";

import { UploadFile } from "@app/api/models";
import { CustomRuleFilesUpload } from "@app/components/CustomRuleFilesUpload";

export interface UploadRulesFilesProps {
  show: boolean;
  taskgroupId?: number;
  existingFiles: UploadFile[];
  onAddFiles: (newFiles: UploadFile[]) => void;
  onClose: () => void;
}

export const UploadRulesFiles: React.FC<UploadRulesFilesProps> = ({
  show,
  taskgroupId,
  existingFiles,
  onAddFiles,
  onClose,
}) => {
  const doesFileAlreadyExist = React.useCallback(
    (fileName: string) => {
      return existingFiles.some((existing) => existing.fileName === fileName);
    },
    [existingFiles]
  );

  const { control } = useForm({
    defaultValues: {
      uploadedFiles: [] as UploadFile[],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "uploadedFiles",
  });

  const filesToFieldsIndex = (files: UploadFile[]) => {
    const indexes: number[] = [];
    if (files && files.length > 0) {
      fields.forEach(({ fileName }, index) => {
        if (files.some((f) => fileName === f.fileName)) {
          indexes.push(index);
        }
      });
    }
    return indexes;
  };

  const onCloseCancel = () => {
    // TODO: Consider any uploaded files and delete them from hub if necessary
    onClose();
  };

  const onAdd = () => {
    onAddFiles(fields);
    onClose();
  };

  const isAddDisabled =
    fields.length === 0 || !fields.every(({ status }) => status === "uploaded");

  return (
    <Modal
      isOpen={show}
      variant="medium"
      title="Add rules"
      onClose={onCloseCancel}
      actions={[
        <Button
          key="add"
          variant="primary"
          isDisabled={isAddDisabled}
          onClick={onAdd}
        >
          Add
        </Button>,
        <Button key="cancel" variant="link" onClick={onCloseCancel}>
          Cancel
        </Button>,
      ]}
    >
      <CustomRuleFilesUpload
        taskgroupId={taskgroupId}
        fileExists={doesFileAlreadyExist}
        ruleFiles={fields}
        onAddRuleFiles={(ruleFiles) => {
          append(ruleFiles);
        }}
        onRemoveRuleFiles={(ruleFiles) => {
          const indexesToRemove = filesToFieldsIndex(ruleFiles);
          if (indexesToRemove.length > 0) {
            remove(indexesToRemove);
          }
        }}
        onChangeRuleFile={(ruleFile) => {
          const index = fields.findIndex(
            (f) => f.fileName === ruleFile.fileName
          );
          if (index >= 0) {
            update(index, ruleFile);
          }
        }}
      />
    </Modal>
  );
};
