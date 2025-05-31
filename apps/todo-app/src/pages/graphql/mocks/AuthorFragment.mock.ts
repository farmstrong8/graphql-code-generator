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
    id: "6442d7f4-bc93-4887-bd50-f79f3db43ac7";
    name: "Eius ut architecto eligendi expedita vel ipsam cupiditate.";
};

export const aAuthorFragmentFragment = createBuilder<AuthorFragmentFragment>({
    __typename: "Author",
    id: "6442d7f4-bc93-4887-bd50-f79f3db43ac7",
    name: "Eius ut architecto eligendi expedita vel ipsam cupiditate.",
});
