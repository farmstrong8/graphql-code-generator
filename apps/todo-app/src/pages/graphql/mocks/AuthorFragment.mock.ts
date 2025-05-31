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
    id: "6f0042c9-e544-4a5c-bf83-8395d7ff372f";
    name: "Sit necessitatibus facere culpa voluptas id.";
};

export const aAuthorFragmentFragment = createBuilder<AuthorFragmentFragment>({
    __typename: "Author",
    id: "6f0042c9-e544-4a5c-bf83-8395d7ff372f",
    name: "Sit necessitatibus facere culpa voluptas id.",
});
