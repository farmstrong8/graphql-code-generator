import type * as Types from "../../../types.generated";

import { gql } from "@apollo/client";
import { AuthorFragmentFragmentDoc } from "./AuthorFragment";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type TodosPageQueryVariables = Types.Exact<{ [key: string]: never }>;

export type TodosPageQuery = {
    __typename?: "Query";
    todos: Array<{
        __typename?: "Todo";
        id: string;
        title: string;
        completed: boolean;
        dueAt?: any | null;
        author: { __typename?: "Author"; id: string; name: string };
    }>;
};

export const TodosPageDocument = gql`
    query TodosPage {
        todos {
            id
            title
            completed
            dueAt
            author {
                ...AuthorFragment
            }
        }
    }
    ${AuthorFragmentFragmentDoc}
`;

/**
 * __useTodosPageQuery__
 *
 * To run a query within a React component, call `useTodosPageQuery` and pass it any options that fit your needs.
 * When your component renders, `useTodosPageQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTodosPageQuery({
 *   variables: {
 *   },
 * });
 */
export function useTodosPageQuery(
    baseOptions?: Apollo.QueryHookOptions<
        TodosPageQuery,
        TodosPageQueryVariables
    >,
) {
    const options = { ...defaultOptions, ...baseOptions };
    return Apollo.useQuery<TodosPageQuery, TodosPageQueryVariables>(
        TodosPageDocument,
        options,
    );
}
export function useTodosPageLazyQuery(
    baseOptions?: Apollo.LazyQueryHookOptions<
        TodosPageQuery,
        TodosPageQueryVariables
    >,
) {
    const options = { ...defaultOptions, ...baseOptions };
    return Apollo.useLazyQuery<TodosPageQuery, TodosPageQueryVariables>(
        TodosPageDocument,
        options,
    );
}
export function useTodosPageSuspenseQuery(
    baseOptions?:
        | Apollo.SkipToken
        | Apollo.SuspenseQueryHookOptions<
              TodosPageQuery,
              TodosPageQueryVariables
          >,
) {
    const options =
        baseOptions === Apollo.skipToken
            ? baseOptions
            : { ...defaultOptions, ...baseOptions };
    return Apollo.useSuspenseQuery<TodosPageQuery, TodosPageQueryVariables>(
        TodosPageDocument,
        options,
    );
}
export type TodosPageQueryHookResult = ReturnType<typeof useTodosPageQuery>;
export type TodosPageLazyQueryHookResult = ReturnType<
    typeof useTodosPageLazyQuery
>;
export type TodosPageSuspenseQueryHookResult = ReturnType<
    typeof useTodosPageSuspenseQuery
>;
export type TodosPageQueryResult = Apollo.QueryResult<
    TodosPageQuery,
    TodosPageQueryVariables
>;
export const namedOperations = {
    Query: {
        TodosPage: "TodosPage",
    },
};
