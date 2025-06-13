/**
 * Constants used throughout the TypeScript mock data generation.
 */

/**
 * Boilerplate code that provides the createBuilder function and DeepPartial type.
 * This template is prepended to all generated mock files.
 */
export const MOCK_BUILDER_BOILERPLATE = `
import { mergeWith } from "lodash";

type DeepPartial<T> = T extends (...args: unknown[]) => unknown
    ? T
    : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

function createBuilder<T extends object>(baseObject: T) {
    return (overrides?: DeepPartial<T>): T =>
        mergeWith({}, baseObject, overrides, (objValue, srcValue) => {
            if (Array.isArray(objValue) && Array.isArray(srcValue)) {
                return srcValue;
            }
        });
}
`.trim();
