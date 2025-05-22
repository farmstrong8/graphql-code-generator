import casual from "casual";
import type { TypeScriptMockDataPluginConfig } from "./config";
import { isValidCasualKey } from "./isValidCasualKey";
import { isPrimitiveScalar } from "./isPrimitiveScalar";
import { generatePrimitiveScalarMock } from "./generatePrimitiveScalarMock";

export function generateScalarMock(
    scalarName: string,
    config: TypeScriptMockDataPluginConfig,
) {
    if (isPrimitiveScalar(scalarName)) {
        return generatePrimitiveScalarMock(scalarName);
    }

    const scalarConfig = config.scalars?.[scalarName];

    console.log(scalarConfig);

    if (!scalarConfig) {
        return `${scalarName.toLowerCase()}-mock`; // fallback, should be unreachable after validation
    }

    if (typeof scalarConfig === "string") {
        if (isValidCasualKey(scalarConfig)) {
            return casual[scalarConfig]();
        }
    }

    if (typeof scalarConfig === "object") {
        const { generator, arguments: args = [] } = scalarConfig;

        if (isValidCasualKey(generator)) {
            const fn = casual[generator];
            if (typeof fn === "function") {
                return Array.isArray(args) ? fn(...args) : fn(args);
            } else {
                return fn;
            }
        }
    }

    throw new Error(
        `Unknown scalar config for "${scalarName}": ${JSON.stringify(scalarConfig)}`,
    );
}
