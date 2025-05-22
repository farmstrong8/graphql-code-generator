import { GraphQLSchema } from "graphql";

export const getRootType = (
    schema: GraphQLSchema,
    op: "query" | "mutation" | "subscription",
) => {
    switch (op) {
        case "query":
            return schema.getQueryType();
        case "mutation":
            return schema.getMutationType();
        case "subscription":
            return schema.getSubscriptionType();
    }
};
