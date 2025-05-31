/**
 * Utility to check if a scalar type is a GraphQL primitive scalar.
 *
 * @param scalarName - The name of the scalar type to check
 * @returns True if the scalar is a primitive GraphQL scalar
 */
export function isPrimitiveScalar(scalarName: string): boolean {
    const graphqlPrimitiveScalars = ["String", "Int", "Float", "Boolean", "ID"];
    return graphqlPrimitiveScalars.includes(scalarName);
}
