/** @type {import("prettier").Config} */
const config = {
    tabWidth: 4,
    printWidth: 100,
    endOfLine: "lf",
    trailingComma: "es5", // es5 was the default in prettier v2
    semi: true,
    singleQuote: false,

    // Values used from .editorconfig:
    //   - printWidth == max_line_length
    //   - tabWidth == indent_size
    //   - useTabs == indent_style
    //   - endOfLine == end_of_line
};

export default config;
