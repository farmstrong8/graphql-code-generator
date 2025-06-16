export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
    [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
    [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
    [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
    T extends { [key: string]: unknown },
    K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
    | T
    | {
          [P in keyof T]?: P extends " $fragmentName" | "__typename"
              ? T[P]
              : never;
      };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: { input: string; output: string };
    String: { input: string; output: string };
    Boolean: { input: boolean; output: boolean };
    Int: { input: number; output: number };
    Float: { input: number; output: number };
    Date: { input: any; output: any };
};

export type Author = {
    __typename?: "Author";
    email: Scalars["String"]["output"];
    id: Scalars["ID"]["output"];
    name: Scalars["String"]["output"];
};

export type Error = {
    __typename?: "Error";
    message: Scalars["String"]["output"];
};

export type Mutation = {
    __typename?: "Mutation";
    addTodo: Todo;
    deleteTodo: Scalars["Boolean"]["output"];
    toggleTodo?: Maybe<Todo>;
};

export type MutationAddTodoArgs = {
    title: Scalars["String"]["input"];
};

export type MutationDeleteTodoArgs = {
    id: Scalars["ID"]["input"];
};

export type MutationToggleTodoArgs = {
    id: Scalars["ID"]["input"];
};

export type Query = {
    __typename?: "Query";
    todo?: Maybe<TodoResult>;
    todos: Array<Todo>;
};

export type QueryTodoArgs = {
    id: Scalars["ID"]["input"];
};

export type Todo = {
    __typename?: "Todo";
    author: Author;
    completed: Scalars["Boolean"]["output"];
    createdAt: Scalars["Date"]["output"];
    dueAt?: Maybe<Scalars["Date"]["output"]>;
    id: Scalars["ID"]["output"];
    status: TodoStatus;
    tags: Array<Scalars["String"]["output"]>;
    title: Scalars["String"]["output"];
};

export type TodoResult = Error | Todo;

export enum TodoStatus {
    Cancelled = "CANCELLED",
    Completed = "COMPLETED",
    Draft = "DRAFT",
    InProgress = "IN_PROGRESS",
}

export interface PossibleTypesResultData {
    possibleTypes: {
        [key: string]: string[];
    };
}
const result: PossibleTypesResultData = {
    possibleTypes: {
        TodoResult: ["Error", "Todo"],
    },
};
export default result;
