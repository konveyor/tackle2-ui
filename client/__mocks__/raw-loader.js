/* global module, require */

const fs = require("fs");

module.exports = {
  process(_sourceText, sourcePath) {
    // Read the content of the file
    const fileContent = fs.readFileSync(sourcePath, "utf8");

    // Export the file content as a default string export
    return {
      code: `module.exports = ${JSON.stringify(fileContent)};`,
    };
  },
};
