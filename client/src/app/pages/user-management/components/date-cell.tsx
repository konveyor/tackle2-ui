import { type FC } from "react";
import dayjs from "dayjs";
import { Tooltip } from "@patternfly/react-core";

/**
 * Truncate an ISO-8601 timestamp to YYYY-MM-DDThh:mm:ss.
 */
const formatIsoDate = (iso: string): string =>
  dayjs(iso).format("YYYY-MM-DDTHH:mm:ssZ");

export const DateCell: FC<{ raw?: string | null }> = ({ raw }) => {
  if (!raw || raw.trim() === "-") return <>-</>;
  return (
    <Tooltip content={raw}>
      <span>{formatIsoDate(raw)}</span>
    </Tooltip>
  );
};
