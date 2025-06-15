/**
 * Micro-service responsible for converting JavaScript values to TypeScript type strings.
 *
 * This service handles the core logic of type inference from runtime values,
 * converting mock data into proper TypeScript type representations.
 */
export class TypeDefinitionService {
    /**
     * Converts a JavaScript value to its TypeScript type representation.
     *
     * @param value - The JavaScript value to convert
     * @param options - Options for type generation
     * @returns TypeScript type string representation
     */
    generateTypeFromValue(
        value: unknown,
        options: TypeGenerationOptions = {},
    ): string {
        if (value === null || value === undefined) {
            return "null";
        }

        if (typeof value === "string") {
            return `"${this.escapeString(value)}"`;
        }

        if (typeof value === "number" || typeof value === "boolean") {
            return String(value);
        }

        if (Array.isArray(value)) {
            if (value.length === 0) {
                return "unknown[]";
            }
            const elementType = this.generateTypeFromValue(value[0], options);
            return `Array<${elementType}>`;
        }

        if (typeof value === "object") {
            return this.generateObjectType(
                value as Record<string, unknown>,
                options,
            );
        }

        return "unknown";
    }

    /**
     * Generates a complete TypeScript type definition with name.
     *
     * @param typeName - The name for the type
     * @param value - The value to generate the type from
     * @param options - Options for type generation
     * @returns Complete TypeScript type definition
     */
    generateNamedTypeDefinition(
        typeName: string,
        value: unknown,
        options: TypeGenerationOptions = {},
    ): string {
        const typeBody =
            options.schemaTypeBody ||
            this.generateTypeFromValue(value, options);
        return `type ${typeName} = ${typeBody};`;
    }

    /**
     * Generates TypeScript object type from a JavaScript object.
     *
     * @param obj - The object to convert
     * @param options - Options for type generation
     * @returns TypeScript object type string
     */
    private generateObjectType(
        obj: Record<string, unknown>,
        options: TypeGenerationOptions,
    ): string {
        const properties: string[] = [];

        for (const [key, val] of Object.entries(obj)) {
            const keyStr = this.needsQuotes(key) ? `"${key}"` : key;
            const valueType = this.generateTypeFromValue(val, options);
            properties.push(`${keyStr}: ${valueType}`);
        }

        return `{\n  ${properties.join(",\n  ")}\n}`;
    }

    /**
     * Determines if a property key needs quotes in TypeScript.
     *
     * @param key - Property key to check
     * @returns True if quotes are needed
     */
    private needsQuotes(key: string): boolean {
        return !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) || key === "__typename";
    }

    /**
     * Escapes special characters in strings for TypeScript string literals.
     *
     * @param str - String to escape
     * @returns Escaped string safe for TypeScript literals
     */
    private escapeString(str: string): string {
        return str
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\r")
            .replace(/\t/g, "\\t");
    }
}

/**
 * Options for configuring type generation behavior.
 */
export interface TypeGenerationOptions {
    /** Pre-generated type body from schema analysis */
    schemaTypeBody?: string;
    /** Whether to generate literal types or semantic types */
    useLiteralTypes?: boolean;
}
