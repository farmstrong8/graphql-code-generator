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
    id: "4aaed166-ef32-4e27-8d8c-e4d151b2139d";
    name: "Ut quos et quibusdam modi cum.";
};

export const aAuthorFragmentFragment = createBuilder<AuthorFragmentFragment>({
    __typename: "Author",
    id: "4aaed166-ef32-4e27-8d8c-e4d151b2139d",
    name: "Ut quos et quibusdam modi cum.",
});
