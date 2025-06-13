import * as Types from '../../../types.generated';

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



type AuthorFragmentFragment = {
  "__typename": "Author",
  id: string,
  name: string
};

export const aAuthorFragmentFragment = createBuilder<AuthorFragmentFragment>({
  "__typename": "Author",
  id: "a024ce92-b3d3-4289-84eb-ba1187b70d4e",
  name: "Deleniti voluptatum quos animi sit."
});