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
    id: "1ef31264-b14f-4234-ae2a-ed64569b2202",
    name: "Est corporis eos quas sunt autem eveniet aut aliquid.",
});
