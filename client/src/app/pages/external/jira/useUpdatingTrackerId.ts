import { useState, useEffect } from "react";

type UpdatableId = string | number | null;

const useUpdatingTrackerId = (delay: number = 5000) => {
  const [updatingTrackerId, setUpdatingTrackerId] = useState<UpdatableId>(null);

  useEffect(() => {
    let timerId: number | null = null;

    if (updatingTrackerId !== null) {
      timerId = window.setTimeout(() => {
        setUpdatingTrackerId(null);
      }, delay);
    }

    return () => {
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, [updatingTrackerId, delay]);

  return [updatingTrackerId, setUpdatingTrackerId] as const;
};

export default useUpdatingTrackerId;
