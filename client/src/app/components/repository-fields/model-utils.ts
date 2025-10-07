import { Repository } from "@app/api/models";
import { RepositoryKind } from "@app/hooks/useRepositoryKind";

export const normalizeRepository = (repository: Repository<RepositoryKind>) => {
  return {
    kind: repository.kind?.trim() ?? "",
    url: repository.url?.trim() ?? "",
    branch: repository.branch?.trim() ?? "",
    path: repository.path?.trim() ?? "",
  };
};

export const isNotEmptyString = (value: unknown) => {
  if (typeof value !== "string") {
    return false;
  }
  return value.length > 0;
};
