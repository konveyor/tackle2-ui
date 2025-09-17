import React from "react";
import { Alert, AlertProps, Icon } from "@patternfly/react-core";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import UnknownIcon from "@patternfly/react-icons/dist/esm/icons/unknown-icon";

import type { StatusType } from "./schema-defined-page";

export const STATUS_MAP: Record<
  StatusType,
  {
    document: string;
    schema: string;
    icon: React.ReactNode;
    variant: AlertProps["variant"];
  }
> = {
  y: {
    document: "Document is valid",
    schema: "Schema is valid",
    icon: <CheckCircleIcon />,
    variant: "success",
  },
  n: {
    document: "Document is invalid",
    schema: "Schema is invalid",
    icon: <ExclamationCircleIcon />,
    variant: "danger",
  },
  "?": {
    document: "Document status is unknown",
    schema: "Schema status is unknown",
    icon: <UnknownIcon />,
    variant: "info",
  },
};

export const DocumentStatusAlert = ({ status }: { status: StatusType }) => {
  const { document, icon, variant } = STATUS_MAP[status];
  return <StatusAlert variant={variant} title={document} icon={icon} />;
};

export const SchemaStatusAlert = ({ status }: { status: StatusType }) => {
  const { schema, icon, variant } = STATUS_MAP[status];
  return <StatusAlert variant={variant} title={schema} icon={icon} />;
};

const StatusAlert = ({
  title,
  icon,
  variant,
}: {
  title: string;
  icon: React.ReactNode;
  variant: AlertProps["variant"];
}) => {
  return (
    <Alert
      variant={variant}
      isInline
      isPlain
      title={title}
      customIcon={
        <Icon status={variant} iconSize="md">
          {icon}
        </Icon>
      }
    />
  );
};
