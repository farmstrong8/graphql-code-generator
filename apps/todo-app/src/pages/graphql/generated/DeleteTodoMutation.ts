import type * as Types from "../../../types.generated";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type DeleteTodoMutationVariables = Types.Exact<{
    deleteTodoId: Types.Scalars["ID"]["input"];
}>;

export type DeleteTodoMutation = {
    __typename?: "Mutation";
    deleteTodo: boolean;
};

export const DeleteTodoDocument = gql`
    mutation DeleteTodo($deleteTodoId: ID!) {
        deleteTodo(id: $deleteTodoId)
    }
`;
export type DeleteTodoMutationFn = Apollo.MutationFunction<
    DeleteTodoMutation,
    DeleteTodoMutationVariables
>;

/**
 * __useDeleteTodoMutation__
 *
 * To run a mutation, you first call `useDeleteTodoMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteTodoMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteTodoMutation, { data, loading, error }] = useDeleteTodoMutation({
 *   variables: {
 *      deleteTodoId: // value for 'deleteTodoId'
 *   },
 * });
 */
export function useDeleteTodoMutation(
    baseOptions?: Apollo.MutationHookOptions<
        DeleteTodoMutation,
        DeleteTodoMutationVariables
    >,
) {
    const options = { ...defaultOptions, ...baseOptions };
    return Apollo.useMutation<DeleteTodoMutation, DeleteTodoMutationVariables>(
        DeleteTodoDocument,
        options,
    );
}
export type DeleteTodoMutationHookResult = ReturnType<
    typeof useDeleteTodoMutation
>;
export type DeleteTodoMutationResult =
    Apollo.MutationResult<DeleteTodoMutation>;
export type DeleteTodoMutationOptions = Apollo.BaseMutationOptions<
    DeleteTodoMutation,
    DeleteTodoMutationVariables
>;
export const namedOperations = {
    Mutation: {
        DeleteTodo: "DeleteTodo",
    },
};
