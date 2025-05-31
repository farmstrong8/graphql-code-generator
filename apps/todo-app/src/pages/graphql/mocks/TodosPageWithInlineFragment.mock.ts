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
    id: string;
    name: string;
};

export const aAuthorFragmentFragment = createBuilder<AuthorFragmentFragment>({
    __typename: "Author",
    id: "af82c42d-fee2-4704-90c3-2e9be389eb05",
    name: "Voluptas corrupti ea aut consequuntur praesentium odio voluptatibus.",
});

type TodosPageWithInlineFragment = {
    todos: Array<{
        id: string;
        title: string;
        completed: boolean;
        dueAt: string;
        author: {};
    }>;
};

export const aTodosPageWithInlineFragment =
    createBuilder<TodosPageWithInlineFragment>({
        __typename: "Query",
        todos: {
            __typename: "Todo",
            id: "87734860-9de7-4af7-9294-5608bd05eaf2",
            title: "Saepe vitae hic libero sapiente ipsa voluptatibus consequatur magnam.",
            completed: false,
            dueAt: "2015-08-24",
            author: {
                __typename: "Author",
                id: "18ae539d-3e4c-4027-aa66-bbe7af973b87",
                name: "Commodi cupiditate ratione sed tempora nostrum qui labore.",
            },
        },
    });
