import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
    schema: "http://localhost:4000/graphql",
    generates: {
        "src/types.generated.ts": {
            documents: ["src/**/*.{ts,tsx,graphql}", "!(src/**/generated/*)"],
            plugins: ["typescript", "fragment-matcher"],
            config: {
                addTypename: true,
            },
        },
        "src/": {
            documents: ["src/**/*.{ts,tsx,graphql}", "!(src/**/generated/*)"],
            preset: "near-operation-file",
            presetConfig: {
                baseTypesPath: "types.generated.ts",
                folder: "generated",
                extension: ".ts",
            },
            config: {
                useTypeImports: true,
                addTypename: true,
            },
            plugins: [
                "typescript-operations",
                "typescript-react-apollo",
                "named-operations-object",
            ],
        },
    },
};

export default config;
