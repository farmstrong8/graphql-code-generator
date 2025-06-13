import type * as Types from '../../../types.generated';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type TodoDetailsPageQueryVariables = Types.Exact<{
  todoId: Types.Scalars['ID']['input'];
}>;


export type TodoDetailsPageQuery = { __typename?: 'Query', todo?: { __typename?: 'Error', message: string } | { __typename?: 'Todo', id: string, title: string, completed: boolean } | null };


export const TodoDetailsPageDocument = gql`
    query TodoDetailsPage($todoId: ID!) {
  todo(id: $todoId) {
    ... on Todo {
      id
      title
      completed
    }
    ... on Error {
      message
    }
  }
}
    `;

/**
 * __useTodoDetailsPageQuery__
 *
 * To run a query within a React component, call `useTodoDetailsPageQuery` and pass it any options that fit your needs.
 * When your component renders, `useTodoDetailsPageQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTodoDetailsPageQuery({
 *   variables: {
 *      todoId: // value for 'todoId'
 *   },
 * });
 */
export function useTodoDetailsPageQuery(baseOptions: Apollo.QueryHookOptions<TodoDetailsPageQuery, TodoDetailsPageQueryVariables> & ({ variables: TodoDetailsPageQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TodoDetailsPageQuery, TodoDetailsPageQueryVariables>(TodoDetailsPageDocument, options);
      }
export function useTodoDetailsPageLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TodoDetailsPageQuery, TodoDetailsPageQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TodoDetailsPageQuery, TodoDetailsPageQueryVariables>(TodoDetailsPageDocument, options);
        }
export function useTodoDetailsPageSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TodoDetailsPageQuery, TodoDetailsPageQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TodoDetailsPageQuery, TodoDetailsPageQueryVariables>(TodoDetailsPageDocument, options);
        }
export type TodoDetailsPageQueryHookResult = ReturnType<typeof useTodoDetailsPageQuery>;
export type TodoDetailsPageLazyQueryHookResult = ReturnType<typeof useTodoDetailsPageLazyQuery>;
export type TodoDetailsPageSuspenseQueryHookResult = ReturnType<typeof useTodoDetailsPageSuspenseQuery>;
export type TodoDetailsPageQueryResult = Apollo.QueryResult<TodoDetailsPageQuery, TodoDetailsPageQueryVariables>;
export const namedOperations = {
  Query: {
    TodoDetailsPage: 'TodoDetailsPage'
  }
}