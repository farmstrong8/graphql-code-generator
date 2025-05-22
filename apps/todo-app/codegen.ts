import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
    schema: "http://localhost:4000/graphql",
    // pluginLoader,
    generates: {
        // 1. Base type definitions
        "src/types.generated.ts": {
            documents: ["src/**/*.{ts,tsx,graphql}", "!(src/**/generated/*)"],
            plugins: ["typescript", "fragment-matcher"],
            config: {
                addTypename: true,
            },
        },

        // 2. Operation-specific hooks and named ops
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

        // 3. Global mock data
        "src/mocks.ts": {
            documents: ["src/**/*.{ts,tsx,graphql}", "!(src/**/generated/*)"],
            plugins: ["typescript-mock-data"],
            config: {
                scalars: {
                    Date: {
                        generator: "date",
                        arguments: "YYYY-MM-DD",
                    },
                },
            },
        },

        // 4. Collocate example
        "src/mocks": {
            documents: ["src/**/*.{ts,tsx,graphql}", "!(src/**/generated/*)"],
            preset: "near-operation-file",
            presetConfig: {
                baseTypesPath: "../types.generated.ts",
                folder: "mocks",
                extension: ".mock.ts",
            },
            plugins: ["typescript-mock-data"],
            config: {
                scalars: {
                    Date: {
                        generator: "date",
                        arguments: "YYYY-MM-DD",
                    },
                },
            },
        },
    },
};

export default config;
