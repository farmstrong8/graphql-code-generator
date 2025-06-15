/**
 * Micro-service responsible for generating TypeScript builder function code.
 *
 * This service handles the core logic of converting mock values into
 * createBuilder() function calls with proper TypeScript syntax.
 */
export class BuilderCodeService {
    /**
     * Generates a complete builder function export statement.
     *
     * @param builderName - Name of the builder function (e.g., "aUser")
     * @param typeName - TypeScript type name (e.g., "User")
     * @param mockValue - Mock data value to embed
     * @param options - Options for builder generation
     * @returns Complete TypeScript builder function string
     */
    generateBuilderFunction(
        builderName: string,
        typeName: string,
        mockValue: unknown,
        options: BuilderGenerationOptions = {},
    ): string {
        const mockValueString = this.generateMockValueLiteral(
            mockValue,
            options,
        );
        return `export const ${builderName} = createBuilder<${typeName}>(${mockValueString});`;
    }

    /**
     * Generates a mock value as a TypeScript literal.
     *
     * @param value - The mock value to convert to TypeScript literal
     * @param options - Options for value generation
     * @returns TypeScript literal string representation
     */
    generateMockValueLiteral(
        value: unknown,
        options: BuilderGenerationOptions = {},
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
            const elements = value.map((item) =>
                this.generateMockValueLiteral(item, options),
            );
            return `[${elements.join(", ")}]`;
        }

        if (typeof value === "object") {
            return this.generateObjectLiteral(
                value as Record<string, unknown>,
                options,
            );
        }

        return "null";
    }

    /**
     * Generates TypeScript object literal from JavaScript object.
     *
     * @param obj - Object to convert
     * @param options - Options for object generation
     * @returns TypeScript object literal string
     */
    private generateObjectLiteral(
        obj: Record<string, unknown>,
        options: BuilderGenerationOptions,
    ): string {
        // Check if this object should use a nested builder
        if (options.nestedBuilders && obj.__typename) {
            const builderName = options.nestedBuilders.get(
                obj.__typename as string,
            );
            if (builderName) {
                return `${builderName}()`;
            }
        }

        const properties: string[] = [];

        for (const [key, val] of Object.entries(obj)) {
            const keyStr = this.needsQuotes(key) ? `"${key}"` : key;
            const valueStr = this.generateMockValueLiteral(val, options);
            properties.push(`${keyStr}: ${valueStr}`);
        }

        return `{\n  ${properties.join(",\n  ")}\n}`;
    }

    /**
     * Determines if a property key needs quotes.
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
 * Options for configuring builder generation behavior.
 */
export interface BuilderGenerationOptions {
    /** Map of typename to nested builder function names */
    nestedBuilders?: Map<string, string>;
    /** Whether to inline simple objects vs use builders */
    inlineSimpleObjects?: boolean;
}
