import { useState } from "react";
import dayjs from "dayjs";

export type UpdatableId = {
  id: number;
  expirationTime: dayjs.ConfigType;
};

const useUpdatingTrackerIds = () => {
  const [updatingTrackerIds, setUpdatingTrackerIds] = useState<
    Map<number, dayjs.Dayjs>
  >(new Map());

  const addUpdatingTrackerId = (id: number) => {
    const now = dayjs();
    const existingExpiry = updatingTrackerIds.get(id);

    if (!existingExpiry || existingExpiry.isBefore(now)) {
      const expiryDate = dayjs().add(8, "seconds");

      setUpdatingTrackerIds((prevMap) => {
        const updatedMap = new Map(prevMap);
        updatedMap.set(id, expiryDate);
        return updatedMap;
      });

      const timeRemaining = expiryDate.diff(now);

      setTimeout(() => {
        setUpdatingTrackerIds((prevMap) => {
          const updatedMap = new Map(prevMap);
          updatedMap.delete(id);
          return updatedMap;
        });
      }, timeRemaining);
    }
  };

  return [updatingTrackerIds, addUpdatingTrackerId] as const;
};

export default useUpdatingTrackerIds;
