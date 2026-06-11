import { UserRoles } from "../../../types/constants";

import { User } from "./user";

export class UserArchitect extends User {
  create() {
    this.createWithRole(UserRoles.architect);
  }
}
