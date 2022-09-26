export type GUID = `${string}-${string}-${string}-${string}-${string}`;
export type UserIdentifier = string | undefined | number;
export type UserUrlIdentifier = Gamertag | XUID | "me";
export type ServiceConfigID = GUID;
export type Gamertag = `gt(${string})`;
export type XUID = `xuid(${string})`;

export interface XboxLiveToken {
	userXUID: string;
	userHash: string;
	XSTSToken: string;
	expiresOn: number;
}

export interface MsaResponse {
	userCode: string;
	deviceCode: string;
	verificationUri: string;
	expiresIn: number;
	interval: number;
	message: string;
}
export interface LiveCache {
	token: {
		token_type: string;
		expires_in: number;
		scope: string;
		access_token: string;
		refresh_token: string;
		user_id: string;
		obtainedOn: number;
	};
}
