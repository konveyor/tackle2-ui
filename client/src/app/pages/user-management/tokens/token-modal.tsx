import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Bullseye,
  Button,
  ClipboardCopy,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@patternfly/react-core";

import { PersonalAccessToken } from "../types";

import { TOKEN_FORM_DEFAULTS, TokenForm, TokenFormValues } from "./token-form";
import { useCreateTokenMutation } from "./use-tokens";

export interface TokenCreateModalProps {
  onClose: () => void;
}

export const TokenCreateModal: FC<
  TokenCreateModalProps & { isOpen: boolean }
> = ({ isOpen, onClose }) =>
  isOpen && <TokenCreateModalInternal onClose={onClose} />;

const TokenCreateModalInternal: FC<TokenCreateModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [revealedPat, setRevealedPat] = useState<PersonalAccessToken | null>(
    null
  );

  const form = useForm<TokenFormValues>({
    defaultValues: TOKEN_FORM_DEFAULTS,
    mode: "onChange",
  });
  const {
    formState: { isValid },
  } = form;
  const {
    mutate: createToken,
    isPending,
    error,
  } = useCreateTokenMutation((pat) => setRevealedPat(pat));

  const handleSubmit = form.handleSubmit((values) => {
    createToken(
      values.lifespan !== "" ? { lifespan: values.lifespan as number } : {}
    );
  });

  if (revealedPat || error) {
    return (
      <Modal isOpen onClose={onClose} variant="medium">
        <ModalHeader
          title={
            revealedPat
              ? t("titles.tokenCreated")
              : t("titles.tokenCreationFailed")
          }
        />
        <ModalBody>
          {revealedPat != null && (
            <>
              <Alert
                variant="warning"
                isInline
                title={t("message.tokenOnlyShownOnce")}
              />
              <br />
              <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied">
                {revealedPat.token ?? ""}
              </ClipboardCopy>
            </>
          )}
          {!!error && (
            <Alert
              variant="danger"
              isInline
              title={t("titles.tokenCreationFailed")}
            />
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={onClose}>
            {t("actions.close")}
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <>
      <Modal isOpen onClose={onClose} variant="small">
        <ModalHeader title={t("titles.createApiKey")} />
        <ModalBody style={{ overflow: "hidden" }}>
          {isPending ? (
            <Bullseye>
              <Spinner />
            </Bullseye>
          ) : (
            <TokenForm form={form} />
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="primary"
            isDisabled={isPending || !isValid}
            onClick={handleSubmit}
          >
            {t("actions.create")}
          </Button>
          <Button variant="link" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};
