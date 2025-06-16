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

type AuthorInlineFragment = { __typename: "Author"; id: string; name: string };

export const aAuthorInlineFragment = createBuilder<AuthorInlineFragment>({
    __typename: "Author",
    id: "33ad3aba-c5db-4791-9e90-79683e7bf81f",
    name: "Iste occaecati soluta aut nobis et.",
});

type TodosPageWithInlineFragmentTodosAuthor = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aTodosPageWithInlineFragmentTodosAuthor =
    createBuilder<TodosPageWithInlineFragmentTodosAuthor>({
        __typename: "Author",
        id: "13fc29c4-1bf7-4a8a-a0ea-47998f5f648c",
        name: "Amet quaerat autem ducimus ipsum id est.",
    });

type TodosPageWithInlineFragmentTodos = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
    dueAt?: string;
    author: { __typename: "Author"; id: string; name: string };
};

export const aTodosPageWithInlineFragmentTodos =
    createBuilder<TodosPageWithInlineFragmentTodos>({
        __typename: "Todo",
        id: "e2bfd942-aa7d-4278-89cb-ffc94e75d60e",
        title: "Autem optio voluptatem laudantium molestiae.",
        completed: true,
        dueAt: "1977-04-01",
        author: aTodosPageWithInlineFragmentTodosAuthor(),
    });

type TodosPageWithInlineFragmentQuery = {
    __typename: "Query";
    todos: Array<{
        __typename: "Todo";
        id: string;
        title: string;
        completed: boolean;
        dueAt?: string;
        author: { __typename: "Author"; id: string; name: string };
    }>;
};

export const aTodosPageWithInlineFragmentQuery =
    createBuilder<TodosPageWithInlineFragmentQuery>({
        __typename: "Query",
        todos: [aTodosPageWithInlineFragmentTodos()],
    });
