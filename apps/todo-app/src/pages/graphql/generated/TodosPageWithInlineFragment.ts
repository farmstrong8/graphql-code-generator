import type * as Types from '../../../types.generated';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type AuthorInlineFragmentFragment = { __typename?: 'Author', id: string, name: string };

export type TodosPageWithInlineFragmentQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type TodosPageWithInlineFragmentQuery = { __typename?: 'Query', todos: Array<{ __typename?: 'Todo', id: string, title: string, completed: boolean, dueAt?: any | null, author: { __typename?: 'Author', id: string, name: string } }> };

export const AuthorInlineFragmentFragmentDoc = gql`
    fragment AuthorInlineFragment on Author {
  id
  name
}
    `;
export const TodosPageWithInlineFragmentDocument = gql`
    query TodosPageWithInlineFragment {
  todos {
    id
    title
    completed
    dueAt
    author {
      ...AuthorInlineFragment
    }
  }
}
    ${AuthorInlineFragmentFragmentDoc}`;

/**
 * __useTodosPageWithInlineFragmentQuery__
 *
 * To run a query within a React component, call `useTodosPageWithInlineFragmentQuery` and pass it any options that fit your needs.
 * When your component renders, `useTodosPageWithInlineFragmentQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTodosPageWithInlineFragmentQuery({
 *   variables: {
 *   },
 * });
 */
export function useTodosPageWithInlineFragmentQuery(baseOptions?: Apollo.QueryHookOptions<TodosPageWithInlineFragmentQuery, TodosPageWithInlineFragmentQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TodosPageWithInlineFragmentQuery, TodosPageWithInlineFragmentQueryVariables>(TodosPageWithInlineFragmentDocument, options);
      }
export function useTodosPageWithInlineFragmentLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TodosPageWithInlineFragmentQuery, TodosPageWithInlineFragmentQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TodosPageWithInlineFragmentQuery, TodosPageWithInlineFragmentQueryVariables>(TodosPageWithInlineFragmentDocument, options);
        }
export function useTodosPageWithInlineFragmentSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TodosPageWithInlineFragmentQuery, TodosPageWithInlineFragmentQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TodosPageWithInlineFragmentQuery, TodosPageWithInlineFragmentQueryVariables>(TodosPageWithInlineFragmentDocument, options);
        }
export type TodosPageWithInlineFragmentQueryHookResult = ReturnType<typeof useTodosPageWithInlineFragmentQuery>;
export type TodosPageWithInlineFragmentLazyQueryHookResult = ReturnType<typeof useTodosPageWithInlineFragmentLazyQuery>;
export type TodosPageWithInlineFragmentSuspenseQueryHookResult = ReturnType<typeof useTodosPageWithInlineFragmentSuspenseQuery>;
export type TodosPageWithInlineFragmentQueryResult = Apollo.QueryResult<TodosPageWithInlineFragmentQuery, TodosPageWithInlineFragmentQueryVariables>;
export const namedOperations = {
  Query: {
    TodosPageWithInlineFragment: 'TodosPageWithInlineFragment'
  },
  Fragment: {
    AuthorInlineFragment: 'AuthorInlineFragment'
  }
}