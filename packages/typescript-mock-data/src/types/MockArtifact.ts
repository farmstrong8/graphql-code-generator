export type MockArtifact = {
    operationName: string;
    operationType: "query" | "mutation" | "subscription" | "fragment";
    code: string;
};
