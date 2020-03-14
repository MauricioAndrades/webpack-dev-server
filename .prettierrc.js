module.exports = {
    printWidth: 120,
    tabWidth: 4,
    singleQuote: false,
    trailingComma: "none",
    arrowParens: "avoid",
    useTabs: false,
    overrides: [
        {
            files: "*.json",
            options: {
                useTabs: false
            }
        }
    ]
};
