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

type TodoDetailsPageQuery = {
    __typename: "Query";
    todo: {
        __typename: "Todo";
        id: "51488129-7547-405e-b4a7-91569ad4b505";
        title: "Fugiat similique voluptatibus commodi neque hic.";
        completed: true;
    };
};

export const aTodoDetailsPageQuery = createBuilder<TodoDetailsPageQuery>({
    __typename: "Query",
    todo: {
        __typename: "Todo",
        id: "51488129-7547-405e-b4a7-91569ad4b505",
        title: "Fugiat similique voluptatibus commodi neque hic.",
        completed: true,
    },
});
