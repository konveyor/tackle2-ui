import React, { Dispatch, FC, SetStateAction } from "react";
import { Trans, useTranslation } from "react-i18next";

import { Text, TextInput } from "@patternfly/react-core";

import "./delete-questionnaire-message.css";

type DeleteQuestionnaireMessageProps = {
  inputName: string;
  setInputName: Dispatch<SetStateAction<string>>;
  questionnaireName: string | undefined;
};

const DeleteQuestionnaireMessage: FC<DeleteQuestionnaireMessageProps> = ({
  inputName,
  setInputName,
  questionnaireName,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Text component="p">{t("dialog.message.deleteQuestionnaire")}</Text>
      <Text component="p">{t("dialog.message.delete")}</Text>

      <Text component="p" className="confirm-deletion">
        <Trans i18nKey="dialog.message.confirmDeletion">
          Confirm deletion by typing <strong>{{ questionnaireName }}</strong>{" "}
          below:
        </Trans>
      </Text>
      <TextInput
        className="confirm-deletion-input"
        value={inputName}
        onChange={(event, value) => setInputName(value)}
      />
    </>
  );
};

export default DeleteQuestionnaireMessage;
