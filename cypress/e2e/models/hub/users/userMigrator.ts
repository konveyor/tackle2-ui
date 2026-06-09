import { UserRoles } from "../../../types/constants";

import { User } from "./user";

export class UserMigrator extends User {
  create() {
    this.createWithRole(UserRoles.migrator);
  }
}
