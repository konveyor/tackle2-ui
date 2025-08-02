import { copyFileSync, existsSync } from "fs";

const src = "cypress.config.ts.example";
const dest = "cypress.config.ts";

if (!existsSync(dest)) {
  console.log(`Creating ${dest} from example config.`);
  copyFileSync(src, dest);
} else {
  console.log(`${dest} already exists. Skipping.`);
}
