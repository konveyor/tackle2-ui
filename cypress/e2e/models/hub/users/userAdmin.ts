import { UserRoles } from "../../../types/constants";

import { User } from "./user";

export class UserAdmin extends User {
  create() {
    this.createWithRole(UserRoles.admin);
  }
}
