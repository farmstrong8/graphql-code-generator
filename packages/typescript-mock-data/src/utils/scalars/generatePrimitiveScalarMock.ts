import casual from "casual";

/**
 * Generates mock values for GraphQL primitive scalar types.
 *
 * @param scalarName - The name of the primitive scalar type
 * @returns A mock value appropriate for the scalar type
 */
export function generatePrimitiveScalarMock(scalarName: string): unknown {
    switch (scalarName) {
        case "ID":
            return casual.uuid;
        case "String":
            return casual.sentence;
        case "Int":
            return casual.integer();
        case "Float":
            return casual.double();
        case "Boolean":
            return casual.boolean;
        default:
            return `${scalarName.toLowerCase()}-mock`;
    }
}
