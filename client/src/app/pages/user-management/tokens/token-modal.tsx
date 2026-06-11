import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  ClipboardCopy,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import { PersonalAccessToken } from "../types";

import { useCreateTokenMutation } from "./use-tokens";
import { TokenForm, TokenFormValues, TOKEN_FORM_DEFAULTS } from "./token-form";

export interface TokenCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TokenCreateModal: FC<TokenCreateModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const [revealedPat, setRevealedPat] = useState<PersonalAccessToken | null>(
    null
  );

  const form = useForm<TokenFormValues>({ defaultValues: TOKEN_FORM_DEFAULTS });
  const { mutate: createToken, isPending } = useCreateTokenMutation((pat) =>
    setRevealedPat(pat)
  );

  const handleSubmit = form.handleSubmit((values) => {
    const lifespanHours = parseInt(values.lifespan, 10);
    createToken({
      ...(lifespanHours > 0 ? { lifespan: lifespanHours } : {}),
    });
  });

  const handleClose = () => {
    setRevealedPat(null);
    form.reset(TOKEN_FORM_DEFAULTS);
    onClose();
  };

  if (revealedPat) {
    return (
      <Modal isOpen onClose={handleClose} variant="medium">
        <ModalHeader title={t("titles.tokenCreated")} />
        <ModalBody>
          <Alert
            variant="warning"
            isInline
            title={t("message.tokenOnlyShownOnce")}
          />
          <br />
          <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied">
            {revealedPat.token ?? ""}
          </ClipboardCopy>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={handleClose}>
            {t("actions.close")}
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <>
      {isOpen && (
        <Modal isOpen onClose={handleClose} variant="small">
          <ModalHeader title={t("titles.createToken")} />
          <ModalBody>
            <TokenForm form={form} />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="primary"
              isDisabled={isPending}
              onClick={handleSubmit}
            >
              {t("actions.create")}
            </Button>
            <Button variant="link" onClick={handleClose}>
              {t("actions.cancel")}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
};
