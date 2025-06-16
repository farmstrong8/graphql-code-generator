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

type AuthorFragment = { __typename: "Author"; id: string; name: string };

export const aAuthorFragment = createBuilder<AuthorFragment>({
    __typename: "Author",
    id: "3065ff0d-28b5-431a-9ee0-2eab53617036",
    name: "Doloremque omnis dolor dolorem itaque qui.",
});
