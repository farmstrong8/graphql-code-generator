import type * as Types from "../../../types.generated";

import { gql } from "@apollo/client";
export type AuthorFragmentFragment = {
    __typename?: "Author";
    id: string;
    name: string;
};

export const AuthorFragmentFragmentDoc = gql`
    fragment AuthorFragment on Author {
        id
        name
    }
`;
export const namedOperations = {
    Fragment: {
        AuthorFragment: "AuthorFragment",
    },
};
