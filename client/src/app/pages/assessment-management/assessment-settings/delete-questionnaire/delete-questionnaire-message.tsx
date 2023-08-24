import React, { Dispatch, FC, SetStateAction } from "react";
import { useTranslation } from "react-i18next";

import { Text, TextInput } from "@patternfly/react-core";

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
      <Text component="p">{t("dialog.message.deleteQuestionnaire")}</Text>
      <Text component="p">{t("dialog.message.delete")}</Text>
      <Text component="p" className="confirm-deletion">
        {t("dialog.message.confirmDeletion", {
          what: t("terms.questionnaire").toLowerCase(),
        })}
      </Text>
      <TextInput
        className="confirm-deletion-input"
        value={questionnaireNameToDelete}
        onChange={(event, value) => setQuestionnaireNameToDelete(value)}
      />
    </>
  );
};

export default DeleteQuestionnaireMessage;
