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

type AddTodoMutation = {
    __typename: "Mutation";
    addTodo: {
        __typename: "Todo";
        id: "cc347d56-e682-48b7-9287-1a911c45bd0b";
        title: "Et neque laboriosam sed illo et voluptatem.";
        completed: true;
    };
};

export const aAddTodoMutation = createBuilder<AddTodoMutation>({
    __typename: "Mutation",
    addTodo: {
        __typename: "Todo",
        id: "cc347d56-e682-48b7-9287-1a911c45bd0b",
        title: "Et neque laboriosam sed illo et voluptatem.",
        completed: true,
    },
});
