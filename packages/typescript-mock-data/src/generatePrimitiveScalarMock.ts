import casual from "casual";

export const generatePrimitiveScalarMock = (scalarName: string) => {
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
            return true;
        default:
            return `${scalarName.toLowerCase()}-mock`;
    }
};
