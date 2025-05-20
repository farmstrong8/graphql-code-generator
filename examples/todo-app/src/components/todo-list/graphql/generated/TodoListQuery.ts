import type * as Types from "../../../../types.generated";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type TodoQueryVariables = Types.Exact<{ [key: string]: never }>;

export type TodoQuery = {
    __typename?: "Query";
    todos: Array<{
        __typename?: "Todo";
        id: string;
        title: string;
        completed: boolean;
    }>;
};

export const TodoDocument = gql`
    query Todo {
        todos {
            id
            title
            completed
        }
    }
`;

/**
 * __useTodoQuery__
 *
 * To run a query within a React component, call `useTodoQuery` and pass it any options that fit your needs.
 * When your component renders, `useTodoQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTodoQuery({
 *   variables: {
 *   },
 * });
 */
export function useTodoQuery(
    baseOptions?: Apollo.QueryHookOptions<TodoQuery, TodoQueryVariables>
) {
    const options = { ...defaultOptions, ...baseOptions };
    return Apollo.useQuery<TodoQuery, TodoQueryVariables>(
        TodoDocument,
        options
    );
}
export function useTodoLazyQuery(
    baseOptions?: Apollo.LazyQueryHookOptions<TodoQuery, TodoQueryVariables>
) {
    const options = { ...defaultOptions, ...baseOptions };
    return Apollo.useLazyQuery<TodoQuery, TodoQueryVariables>(
        TodoDocument,
        options
    );
}
export function useTodoSuspenseQuery(
    baseOptions?:
        | Apollo.SkipToken
        | Apollo.SuspenseQueryHookOptions<TodoQuery, TodoQueryVariables>
) {
    const options =
        baseOptions === Apollo.skipToken
            ? baseOptions
            : { ...defaultOptions, ...baseOptions };
    return Apollo.useSuspenseQuery<TodoQuery, TodoQueryVariables>(
        TodoDocument,
        options
    );
}
export type TodoQueryHookResult = ReturnType<typeof useTodoQuery>;
export type TodoLazyQueryHookResult = ReturnType<typeof useTodoLazyQuery>;
export type TodoSuspenseQueryHookResult = ReturnType<
    typeof useTodoSuspenseQuery
>;
export type TodoQueryResult = Apollo.QueryResult<TodoQuery, TodoQueryVariables>;
