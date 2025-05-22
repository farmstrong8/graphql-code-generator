import { PluginValidateFn } from "@graphql-codegen/plugin-helpers";
import { GraphQLScalarType } from "graphql";
import { TypeScriptMockDataPluginConfig } from "./config";

export const validate: PluginValidateFn<TypeScriptMockDataPluginConfig> = (
    schema,
    documents,
    config,
) => {
    const scalarTypeMap = schema.getTypeMap();
    const definedScalars = Object.values(scalarTypeMap)
        .filter((t) => t instanceof GraphQLScalarType)
        .map((s) => s.name)
        .filter(
            (name) =>
                !["String", "ID", "Boolean", "Int", "Float"].includes(name),
        );

    const configuredScalars = Object.keys(config.scalars || {});

    const missingMocks = definedScalars.filter(
        (scalar) => !configuredScalars.includes(scalar),
    );

    if (missingMocks.length > 0) {
        throw new Error(
            `Missing scalar mock definitions for: ${missingMocks.join(
                ", ",
            )}.\n` + `Please add them to your plugin config under 'scalars'.`,
        );
    }
};
