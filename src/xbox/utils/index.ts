import { UserIdentifier, UserUrlIdentifier } from "../types";
// check if all the characters in the string are numbers
const isNumber = (str: string) => {
	return /^\d+$/.test(str);
};
export const parseIdentifier = (
	identifier?: string | number
): UserUrlIdentifier => {
	switch (typeof identifier) {
		case "number":
			return `xuid(${identifier})`;
		case "undefined":
			return "me";
		case "string":
			if (isNumber(identifier) && identifier.length >=16) return `xuid(${identifier})`;
			return `gt(${identifier})`;
	}
};
