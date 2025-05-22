type BuildMockCodeParams = {
    operationName: string;
    operationType: "query" | "mutation" | "subscription" | "fragment";
    mockObject: unknown;
};

export function buildMockCode({
    operationName,
    operationType,
    mockObject,
}: BuildMockCodeParams): string {
    const suffix =
        operationType.charAt(0).toUpperCase() + operationType.slice(1); // "Query", "Mutation", etc.
    const typeName = `${operationName}${suffix}`;
    const variableName = `a${operationName}${suffix}`;
    const mockJson = JSON.stringify(mockObject, null, 2);

    return `
  type ${typeName} = ${mockJson};
  
  export const ${variableName} = createBuilder<${typeName}>(${mockJson});
    `.trim();
}
