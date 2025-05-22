const graphqlPrimitiveScalars = ["String", "Int", "Float", "Boolean", "ID"];

export const isPrimitiveScalar = (scalarName: string): boolean => {
    return graphqlPrimitiveScalars.includes(scalarName);
};
