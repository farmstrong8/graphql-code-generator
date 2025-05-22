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

type TodosPageQuery = {
    __typename: "Query";
    todos: {
        __typename: "Todo";
        id: "7847221c-4880-41c1-b97a-94fcf5f37176";
        title: "Sunt quod ea quis quis quis ducimus hic.";
        completed: true;
        dueAt: "1974-06-14";
        author: null;
    };
};

export const aTodosPageQuery = createBuilder<TodosPageQuery>({
    __typename: "Query",
    todos: {
        __typename: "Todo",
        id: "7847221c-4880-41c1-b97a-94fcf5f37176",
        title: "Sunt quod ea quis quis quis ducimus hic.",
        completed: true,
        dueAt: "1974-06-14",
        author: null,
    },
});
