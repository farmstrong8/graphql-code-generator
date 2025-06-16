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

type ToggleTodoToggleTodo = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
};

export const aToggleTodoToggleTodo = createBuilder<ToggleTodoToggleTodo>({
    __typename: "Todo",
    id: "144cfb85-bf1b-485c-aedc-72e65dbd4424",
    title: "Ab dolores hic veniam saepe dignissimos reprehenderit.",
    completed: true,
});

type ToggleTodoMutation = {
    __typename: "Mutation";
    toggleTodo?: {
        __typename: "Todo";
        id: string;
        title: string;
        completed: boolean;
    };
};

export const aToggleTodoMutation = createBuilder<ToggleTodoMutation>({
    __typename: "Mutation",
    toggleTodo: aToggleTodoToggleTodo(),
});
