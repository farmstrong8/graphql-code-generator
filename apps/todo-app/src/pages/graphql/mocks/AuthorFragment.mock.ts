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

type AuthorFragment = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aAuthorFragment = createBuilder<AuthorFragment>({
    __typename: "Author",
    id: "90368f81-3844-423b-944f-49dbd6e1ed44",
    name: "Quaerat dolor ratione delectus alias voluptas.",
});
