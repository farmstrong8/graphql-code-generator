/**
 * Configuration for generating mock values for a specific scalar type.
 * Can be either a simple generator name string or a detailed configuration object.
 */
export type ScalarGeneratorConfig =
    | string
    | {
          generator: string;
          arguments?: string | number | boolean | (string | number | boolean)[];
      };

/**
 * Main plugin configuration interface.
 */
export type TypeScriptMockDataPluginConfig = {
    scalars?: Record<string, ScalarGeneratorConfig>;
};
