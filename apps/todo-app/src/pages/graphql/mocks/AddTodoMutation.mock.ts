import * as Types from "../../../types.generated";

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

type AddTodoAddTodo = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
};

export const aAddTodoAddTodo = createBuilder<AddTodoAddTodo>({
    __typename: "Todo",
    id: "029d3d18-6398-4df5-9cfb-26580cdbc9ff",
    title: "Molestiae doloribus possimus expedita illum autem sunt earum debitis.",
    completed: false,
});

type AddTodoMutation = {
    __typename: "Mutation";
    addTodo: {
        __typename: "Todo";
        id: string;
        title: string;
        completed: boolean;
    };
};

export const aAddTodoMutation = createBuilder<AddTodoMutation>({
    __typename: "Mutation",
    addTodo: aAddTodoAddTodo(),
});
