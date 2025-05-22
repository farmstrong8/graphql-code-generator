export type ScalarGeneratorConfig =
    | string
    | {
          generator: string;
          arguments?: string | number | boolean | (string | number | boolean)[];
      };

export type TypeScriptMockDataPluginConfig = {
    scalars?: Record<string, ScalarGeneratorConfig>;
};
