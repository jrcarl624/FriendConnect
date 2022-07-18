interface XboxTokenInfo {
	userXUID: string;
	userHash: string;
	XSTSToken: string;
	expiresOn: string;
}

interface Xui {
	gtg: string;
	xid: string;
	uhs: string;
	usr: string;
	prv: string;
	agg: string;
}

interface GenericAuthenticationResponse {
	IssueInstant: string;
	NotAfter: string;
	Token: string;
	DisplayClaims: {
		xui: Xui[];
		xdi: {
			did: string;
			dcs: string;
		};
		xti: {
			tid: string;
		};
	};
}

//    tokenHeader = "XBL3.0 x=" + this.userHash + ";" + this.XSTSToken;

interface GenericAuthenticationRequest {
	RelayingParty: string;
	TokenType: string;
	Properties: Record<string, any>;

	UserProperties?: {
		AuthMethod: string;
		SiteName: string;
		RpsTicket: string;
		ProofKey: Record<string, any>;
	};

	DeviceProperties?: {
		AuthMethod: string;
		Id: string;
		DeviceType: string;
		SerialNumber: string;
		Version: string;
		ProofKey: Record<string, any>;
	};
	XSTSProperties: {
		UserTokens: string[];
		DeviceToken: string;
		TitleToken: string;
		SandboxId: string;
		ProofKey: Record<string, any>;
	};
	TitleProperties: {
		AuthMethod: string;
		DeviceToken: string;
		TitleToken: string;
		SandboxId: string;
		ProofKey: Record<string, any>;
	};
}

interface LiveDeviceCodeResponse {
	user_code: string;
	device_code: string;
	verification_uri: string;
	expires_in: number;
	interval: number;
}

interface LiveTokenResponse {
	token_type: string;
	scope: string;
	expires_in: number;
	access_token: string;
	refresh_token: string;
	id_token: string;
	user_id: string;
	error: string;
	error_description: string;
	correlation_id: string;
}

interface LiveTokenCache {
	obtainedOn: number;
	token: LiveTokenResponse;
}

interface XboxTokenCache {
	userToken: GenericAuthenticationResponse;
	xstsToken: XboxTokenInfo;
}
import fs from "fs";

const XboxAuth = class {
	constructor(cachePath: fs.PathLike) {}
};
