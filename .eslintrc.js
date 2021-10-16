module.exports = {
    extends: ["eslint:recommended", "plugin:prettier/recommended"],
    globals: {
        Atomics: "readonly",
        SharedArrayBuffer: "readonly",
    },
    overrides: [
        {
            files: ["*.ts"],
            plugins: ["@typescript-eslint", "fp-ts"],
            extends: [
                "plugin:@typescript-eslint/eslint-recommended",
                "plugin:@typescript-eslint/recommended",
                "plugin:fp-ts/recommended",
                "prettier/@typescript-eslint",
            ],
            rules: {
                "@typescript-eslint/no-unused-vars": [
                    "warn",
                    {
                        argsIgnorePattern: "^_",
                    },
                ],
            },
        },
        {
            files: ["*.test.ts"],
            plugins: ["jest"],
            rules: {},
        },
    ],
}
