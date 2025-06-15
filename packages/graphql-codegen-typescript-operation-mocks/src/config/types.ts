/**
 * Configuration for scalar value generation.
 */
export type ScalarGeneratorConfig =
    | string
    | {
          generator: string;
          arguments?: string | number | boolean | (string | number | boolean)[];
      };

/**
 * Configuration for naming behavior.
 */
export interface NamingOptions {
    /** Whether to add operation suffixes (Query, Mutation, Subscription, Fragment) to type names */
    addOperationSuffix?: boolean;
}

/**
 * Main plugin configuration interface.
 */
export type TypeScriptMockDataPluginConfig = {
    /** Scalar type mappings for mock value generation */
    scalars?: Record<string, ScalarGeneratorConfig>;
    /** Naming behavior configuration */
    naming?: NamingOptions;
};
