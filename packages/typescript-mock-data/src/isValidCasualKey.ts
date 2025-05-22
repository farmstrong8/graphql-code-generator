import casual from "casual";

export const isValidCasualKey = (key: string): key is keyof typeof casual => {
    return key in casual;
};
