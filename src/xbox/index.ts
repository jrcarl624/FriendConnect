import { createHash } from "prismarine-auth/src/common/Util.js";
import Achievements from "./modules/achievements.js";
import { LiveCache, MsaResponse, UserIdentifier, XboxLiveToken } from "./types";
import authPkg from "prismarine-auth";
const { Authflow } = authPkg;
import fs from "fs";
import EventEmitter from "events";
import uniRest from "unirest";

import SessionDirectory from "./modules/sessionDirectory.js";
import Social from "./modules/social.js";
import PeopleHub from "./modules/peopleHub.js";

interface XboxLiveTokenProvider {
	userXuid: string;
	userHash: string;
	xstsToken: string;
	expiresOn: number;
	isRefreshing: boolean;
	reset(): void;
	refresh(): Promise<XboxLiveToken>;
}

export class LinkCodeTokenProvider
	extends EventEmitter
	implements XboxLiveTokenProvider
{
	get userXuid(): string {
		return this.#token.userXUID;
	}
	get userHash(): string {
		return this.#token.userHash;
	}
	get xstsToken(): string {
		return this.#token.XSTSToken;
	}
	get expiresOn(): number {
		return this.#token.expiresOn;
	}
	#isTokenRefreshing: boolean = true;
	email: string;
	authOptions: authPkg.MicrosoftAuthFlowOptions;
	cachePath: string;
	emailHash: string;
	clientId: string;
	liveCache: LiveCache;
	#token: XboxLiveToken;
	firstTokenAcquired: boolean;
	static readonly uri = "https://login.live.com/oauth20_token.srf";

	get isRefreshing(): boolean {
		return this.#isTokenRefreshing;
	}
	constructor(
		email: string,
		tokenPath: string,
		options?: authPkg.MicrosoftAuthFlowOptions,
		codeCallback?: (res: {
			userCode: string;
			deviceCode: string;
			verificationUri: string;
			expiresIn: number;
			interval: number;
			message: string;
		}) => void
	) {
		super();
		this.email = email;
		this.authOptions = options || {};
		this.cachePath = tokenPath || "./auth";
		this.emailHash = createHash(email);
		this.clientId = options.authTitle || "00000000441cc96b";
		this.on("msaAuthCodePrompt", (msa: MsaResponse) => {
			if (codeCallback) codeCallback(msa);
			console.log(
				msa.message,
				"\nPlease login with this email:",
				this.email
			);
		});
		this.refresh();
	}

	reset(): void {
		fs.unlinkSync(`${this.cachePath}/${this.emailHash}_xbl-cache.json`);
	}
	async refresh(): Promise<XboxLiveToken> {
		this.#isTokenRefreshing = true;
		if (!fs.existsSync(this.cachePath))
			fs.mkdirSync(this.cachePath, { recursive: true });
		let liveCache: LiveCache;
		try {
			liveCache = JSON.parse(
				fs.readFileSync(
					`${this.cachePath}/${this.emailHash}_live-cache.json`,
					"utf8"
				)
			);
		} catch {
			return this.get();
		}
		if (!liveCache.token) {
			if (this.liveCache) {
				liveCache = this.liveCache;
			} else return this.get();
		}

		const res = await fetch(LinkCodeTokenProvider.uri, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				scope: liveCache.token.scope,
				client_id: this.clientId,
				grant_type: "refresh_token",
				refresh_token: liveCache.token.refresh_token,
			}),
		});
		let json = await res.json();
		this.liveCache = {
			token: { ...json, obtainedOn: Date.now() },
		};
		//console.log(json)
		//console.log(this.liveCache);
		fs.writeFileSync(
			`${this.cachePath}/${this.emailHash}_live-cache.json`,
			JSON.stringify(this.liveCache),
			"utf8"
		);

		if (fs.existsSync(`${this.cachePath}/${this.emailHash}_xbl-cache.json`))
			this.reset();
		return this.get();
	}

	private setRefreshInterval() {
		let expiry = this.liveCache.token.expires_in * 1000;
		expiry += this.liveCache.token.obtainedOn;
		setInterval(() => {
			if (expiry - Date.now() - 3600000 < 0) this.refresh();
		}, 900000);
	}

	async get(): Promise<XboxLiveToken> {
		//debug(this.email, this.authPath, this.authOptions);

		let token = await new Authflow(
			this.email,
			this.cachePath,
			this.authOptions,
			(res: MsaResponse) => {
				//debug(`getToken msa code`);
				this.emit("msaAuthCodePrompt", res);
			}
		).getXboxToken();

		this.liveCache = JSON.parse(
			fs.readFileSync(
				`${this.cachePath}/${this.emailHash}_live-cache.json`,
				"utf8"
			)
		);

		this.#token = token;

		this.#isTokenRefreshing = false;
		if (!this.firstTokenAcquired) {
			this.setRefreshInterval();
			this.emit("firstTokenAcquired");
		}
		this.firstTokenAcquired = true;
		return token;
	}
}
/*
 	readonly URIs = {
		gamerPic: "https://gamerpics.xboxlive.com",
		leaderBoard: "https://leaderboards.xboxlive.com",
		list: "https://eplists.xboxlive.com",
		entertainmentDiscovery: "https://eds.xboxlive.com",
		marketplace: "https://marketplace.xboxlive.com",
		matchmaking: "https://momatch.xboxlive.com",
		multiplayerActivity: "https://multiplayeractivity.xboxlive.com",
		presence: "https://userpresence.xboxlive.com",
		privacy: "https://privacy.xboxlive.com",
		profile: "https://profile.xboxlive.com",
		titleStorage: "https://titlestorage.xboxlive.com",
		clientStrings: "https://client-strings.xboxlive.com",
		message: "https://msg.xboxlive.com",
		userStats: "https://userstats.xboxlive.com",
	};
 */
export class XboxClient extends EventEmitter {
	token: XboxLiveTokenProvider;
	get xuid(): string {
		return this.token.userXuid;
	}
	get authorizationHeader(): string {
		return `XBL3.0 x=${this.token.userHash};${this.token.xstsToken}`;
	}
	readonly social: Social;
	readonly sessionDirectory: SessionDirectory;
	readonly achievements: Achievements;
	readonly peopleHub: PeopleHub;
	constructor(tokenProvider: XboxLiveTokenProvider) {
		super();
		this.token = tokenProvider;
		this.social = new Social(this);
		this.sessionDirectory = new SessionDirectory(this);
		this.achievements = new Achievements(this);
		this.peopleHub = new PeopleHub(this);
	}
}
