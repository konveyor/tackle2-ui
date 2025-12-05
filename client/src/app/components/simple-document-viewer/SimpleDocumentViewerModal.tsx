import * as React from "react";
import { Button, Modal, ModalProps } from "@patternfly/react-core";
import { css } from "@patternfly/react-styles";

import {
  ISimpleDocumentViewerProps,
  SimpleDocumentViewer,
} from "./SimpleDocumentViewer";
import "./SimpleDocumentViewer.css";

export interface ISimpleDocumentViewerModalProps extends ISimpleDocumentViewerProps {
  /** Simple text content of the modal header. */
  title?: string;

  /** A callback for when the close button is clicked. */
  onClose?: ModalProps["onClose"];

  /**
   * Position of the modal, `"top"` aligned or `"normal"`/centered on the view.
   * Defaults to `top`.
   */
  position?: "top" | "normal";

  /**
   * Flag indicating if the modal should be displayed as tall as possible.
   * Defaults to `true`.
   */
  isFullHeight?: boolean;
}

/**
 * Inside of a Modal window, fetch and then use the `SimpleDocumentViewer` to display
 * a document in read-only mode with language highlighting applied.  The modal will be
 * displayed if the `documentId` is set.  If `documentId` is `undefined`, the modal is
 * closed.
 */

export const SimpleDocumentViewerModal = ({
  title,
  taskId: documentId,
  onClose,
  position = "top",
  isFullHeight = true,
  ...rest
}: ISimpleDocumentViewerModalProps) => {
  const isOpen = documentId !== undefined;

  return (
    <Modal
      className={css(
        "simple-task-viewer",
        isFullHeight && position === "top" && "full-height-top",
        isFullHeight && position !== "top" && "full-height"
      )}
      isOpen={isOpen}
      onClose={onClose}
      variant="large"
      position={position === "top" ? "top" : undefined}
      title={title ?? `Analysis details for task instance ${documentId}`}
      actions={[
        <Button key="close" variant="link" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <SimpleDocumentViewer
        taskId={documentId}
        height={isFullHeight ? "full" : undefined}
        {...rest}
      />
    </Modal>
  );
};
