import type * as Types from "../../../types.generated";

import { gql } from "@apollo/client";
export type AuthorFragment = {
    __typename?: "Author";
    id: string;
    name: string;
};

export const AuthorFragmentDoc = gql`
    fragment Author on Author {
        id
        name
    }
`;
export const namedOperations = {
    Fragment: {
        Author: "Author",
    },
};
