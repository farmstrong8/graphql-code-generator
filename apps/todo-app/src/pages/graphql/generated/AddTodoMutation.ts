import type * as Types from "../../../types.generated";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type AddTodoMutationVariables = Types.Exact<{
    title: Types.Scalars["String"]["input"];
}>;

export type AddTodoMutation = {
    __typename?: "Mutation";
    addTodo: {
        __typename?: "Todo";
        id: string;
        title: string;
        completed: boolean;
    };
};

export const AddTodoDocument = gql`
    mutation AddTodo($title: String!) {
        addTodo(title: $title) {
            id
            title
            completed
        }
    }
`;
export type AddTodoMutationFn = Apollo.MutationFunction<
    AddTodoMutation,
    AddTodoMutationVariables
>;

/**
 * __useAddTodoMutation__
 *
 * To run a mutation, you first call `useAddTodoMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddTodoMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addTodoMutation, { data, loading, error }] = useAddTodoMutation({
 *   variables: {
 *      title: // value for 'title'
 *   },
 * });
 */
export function useAddTodoMutation(
    baseOptions?: Apollo.MutationHookOptions<
        AddTodoMutation,
        AddTodoMutationVariables
    >,
) {
    const options = { ...defaultOptions, ...baseOptions };
    return Apollo.useMutation<AddTodoMutation, AddTodoMutationVariables>(
        AddTodoDocument,
        options,
    );
}
export type AddTodoMutationHookResult = ReturnType<typeof useAddTodoMutation>;
export type AddTodoMutationResult = Apollo.MutationResult<AddTodoMutation>;
export type AddTodoMutationOptions = Apollo.BaseMutationOptions<
    AddTodoMutation,
    AddTodoMutationVariables
>;
export const namedOperations = {
    Mutation: {
        AddTodo: "AddTodo",
    },
};
