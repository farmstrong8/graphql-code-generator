type GenerateMockCodeParams = {
    operationName: string;
    mockObject: unknown;
};

export function buildMockCode({
    operationName,
    mockObject,
}: GenerateMockCodeParams): string {
    const typeName = operationName;
    const variableName = `a${operationName}`;
    const mockJson = JSON.stringify(mockObject, null, 2);

    return `
  type ${typeName} = ${mockJson};
  
  export const ${variableName} = createBuilder<${typeName}>(${mockJson});
  `.trim();
}
