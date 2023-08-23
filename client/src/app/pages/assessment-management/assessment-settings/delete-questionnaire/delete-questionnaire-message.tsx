import React, { Dispatch, FC, SetStateAction } from "react";
import { useTranslation } from "react-i18next";

import { TextInput } from "@patternfly/react-core";

import "./delete-questionnaire-message.css";

type DeleteQuestionnaireMessageProps = {
  questionnaireNameToDelete: string;
  setQuestionnaireNameToDelete: Dispatch<SetStateAction<string>>;
};

const DeleteQuestionnaireMessage: FC<DeleteQuestionnaireMessageProps> = ({
  questionnaireNameToDelete,
  setQuestionnaireNameToDelete,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <p>{t("dialog.message.deleteQuestionnaire")}</p>
      <p>{t("dialog.message.delete")}</p>
      <p className="confirm-deletion">
        {t("dialog.message.confirmDeletion", {
          what: t("terms.questionnaire").toLowerCase(),
        })}
      </p>
      <TextInput
        className="confirm-deletion-input"
        value={questionnaireNameToDelete}
        onChange={(event, value) => setQuestionnaireNameToDelete(value)}
      />
    </>
  );
};

export default DeleteQuestionnaireMessage;
