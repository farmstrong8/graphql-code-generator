import * as Types from "../../../types.generated";

import { merge } from "lodash";

type DeepPartial<T> = T extends (...args: unknown[]) => unknown
    ? T
    : T extends Array<infer U>
      ? Array<DeepPartial<U>>
      : T extends object
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : T;

function createBuilder<T extends object>(base: T) {
    return (overrides?: DeepPartial<T>): T => merge({}, base, overrides);
}

type AuthorFragmentFragment = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aAuthorFragmentFragment = createBuilder<AuthorFragmentFragment>({
    __typename: "Author",
    id: "0d4d843b-a2e1-4f5c-99b8-3bf5bc425500",
    name: "Saepe et est rem et.",
});
