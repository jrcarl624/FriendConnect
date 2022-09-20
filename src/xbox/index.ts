export interface XboxLiveToken {
	userXUID: string;
	userHash: string;
	XSTSToken: string;
	expiresOn: number;
}

export namespace SocialTypes {
	export interface PeopleList {
		people: Person[];
		totalCount: number;
	}
	export interface Person {
		xuid: string;
		isFavorite: boolean;
		isFollowingCaller?: boolean;
		socialNetworks?: string[];
	}
	/**
	 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-personsummary
	 */
	export interface PersonSummary {
		targetFollowingCount: number;

		targetFollowerCount: number;
		/**
		 * Whether the caller is following the target. Example values: true
		 */
		isCallerFollowingTarget: boolean;
		isTargetFollowingCaller: boolean;
		/**
		 * Whether the caller has marked the target as a favorite. Example values: true
		 */
		hasCallerMarkedTargetAsFavorite: boolean;
		/**
		 * Whether the caller has marked the target as known. Example values: true
		 */
		hasCallerMarkedTargetAsKnown: boolean;

		legacyFriendStatus:
			| "None"
			| "MutuallyAccepted"
			| "OutgoingRequest"
			| "IncomingRequest";
		recentChangeCount: number;
		watermark: string;
	}
}
import * as XboxRestTypes from "./xboxRestTypes";
import { Achievement, MultiplayerSessionReference } from "./xboxRestTypes";
class Social {
	private readonly xbox: XboxLiveClient;
	static readonly uri: string = "https://social.xboxlive.com";
	constructor(xboxLiveInstance: XboxLiveClient) {
		this.xbox = xboxLiveInstance;
	}
	async getFriends(): Promise<XboxRestTypes.PeopleList> {
		const res = await fetch(`${Social.uri}/users/me/people`, {
			method: "GET",
			headers: {
				Authorization: this.xbox.tokenHeader,
			},
		});
		const data = await res.json();
		return data;
	}
	addFriend(identifier: UserIdentifier) {
		return fetch(
			`${Social.uri}/users/me/people/${parseIdentifier(identifier)}`,
			{
				method: "PUT",
				headers: {
					Authorization: this.xbox.tokenHeader,
				},
			}
		);
	}
	removeFriend(identifier: UserIdentifier) {
		return fetch(
			`${Social.uri}/users/me/people/${parseIdentifier(identifier)}`,
			{
				method: "DELETE",
				headers: {
					Authorization: this.xbox.tokenHeader,
				},
			}
		);
	}
	async getProfile(identifier: UserIdentifier): Promise<SocialTypes.Person> {
		const res = await fetch(
			`${Social.uri}/users/me/people/${parseIdentifier(identifier)}`,
			{
				method: "GET",
				headers: {
					Authorization: this.xbox.tokenHeader,
				},
			}
		);
		let data = await res.json();
		return data;
	}
	async getProfileSummary(
		identifier: UserIdentifier
	): Promise<SocialTypes.PersonSummary> {
		const res = await fetch(
			`${Social.uri}/users/${parseIdentifier(identifier)}/summary`,
			{
				method: "GET",
				headers: {
					Authorization: this.xbox.tokenHeader,
				},
			}
		);
		let data = await res.json();
		return data;
	}
}

type GUID = `${string}-${string}-${string}-${string}-${string}`;
type UserIdentifier = number | string;

type UserUrlIdentifier = Gamertag | XUID;
type ServiceConfigID = GUID;
type Gamertag = `gt(${string})`;
type XUID = `xuid(${number})`;

const parseIdentifier = (identifier: UserIdentifier): UserUrlIdentifier => {
	switch (typeof identifier) {
		case "string":
			return `gt(${identifier})`;
		case "number":
			return `xuid(${identifier})`;
	}
};

class Achievements {
	private readonly xbox: XboxLiveClient;
	static readonly uri: string = "https://achievements.xboxlive.com";
	constructor(xboxLiveInstance: XboxLiveClient) {
		this.xbox = xboxLiveInstance;
	}
	//TODO language type
	async getAchievements(
		identifier: UserIdentifier,
		language?: string
	): Promise<XboxRestTypes.Achievement[]> {
		const res = await fetch(
			`${Achievements.uri}/users/${parseIdentifier(
				identifier
			)}/achievements`,
			{
				method: "GET",
				headers: {
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": "5",
					"Accept-Language": language ?? "en-us",
				},
			}
		);
		let data = await res.json();
		return data.achievements;
	}
	async getAchievement(
		identifier: UserIdentifier,
		serviceConfigId: ServiceConfigID,
		achievementId: number,
		language?: string
	): Promise<{ achievements: XboxRestTypes.Achievement }> {
		const res = await fetch(
			`${Achievements.uri}/users/${parseIdentifier(
				identifier
			)}/achievements/${serviceConfigId}/${achievementId}`,
			{
				method: "GET",
				headers: {
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": "5",
					"Content-Length": "0",
					"Accept-Language": language ?? "en-us",
				},
			}
		);
		let data = await res.json();
		return data.achievement;
	}
}

export namespace SessionDirectoryTypes {
	export interface MultiplayerSessionRequest {
		/**
		 * Read-only settings that are merged with the session template to produce the constants for the session.
		 */
		constants: {
			[key: string]: any;
		};
		/**
		 * Changes to be merged into the session properties.
		 */
		properties: {
			[key: string]: any;
		};
		members: {
			/**
			 * Requires a service principal. Existing members can be deleted by index.
			 * Not available on large sessions.
			 */
			"5": null;

			/**
			 * Reservation requests must start with zero. New users will get added in order to the end of the session's member list.
			 * Large sessions don't support reservations.
			 */
			[key: `reserve_${number}`]: {
				constants: {
					[key: string]: any;
				};
			};

			/**
			 * Constants and properties that work much like their top-level counterparts. Any PUT method requires the user to be a member of the session, and adds the user if necessary. If "me" is specified as null, the member making the request is removed from the session.
			 * Requires a user principal with a xuid claim. Can be 'null' to remove myself from the session.
			 */
			me: {
				constants: {
					[key: string]: any;
				};
				properties: {
					[key: string]: any;
				};
			} | null;
		};

		/**
		 * Values indicating updates and additions to the session's set of associated server participants. If a server is specified as null, that server entry is removed from the session.
		 * Requires a server principal.
		 */
		servers: {
			/**
			 *  Can be any name. The value can be 'null' to remove the server from the session.
			 */
			[key: string]: {
				constants: {
					[key: string]: any;
				};
				properties: {
					[key: string]: any;
				};
			} | null;
		};
	}

	export interface HandleQueryResult {
		id: GUID;
		type: string;
		version: number;
		sessionRef: XboxRestTypes.MultiplayerSessionReference;
		titleId: string;
		ownerXuid: string;
		relatedInfo?: {
			visibility: string;
			joinRestriction: string;
			closed: boolean;
			maxMembersCount: number;
			membersCount: number;
		};
	}

	export interface HandleQueryResponse {
		results: HandleQueryResult[];
	}

	export interface SessionQueries {
		/**
		 * A keyword, for example, "foo", that must be found in sessions or templates if they are to be retrieved.
		 */
		keyword: string;
		/**
		 * The Xbox user ID, for example, "123", for sessions to include in the query. By default, the user must be active in the session for it to be included.
		 */
		xuid: string;
		/**
		 * 	True to include sessions for which the user is set as a reserved player but has not joined to become an active player. This parameter is only used when querying your own sessions, or when querying a specific user's sessions server-to-server.
		 */
		reservations: "true" | "false";
		/**
		 *	True to include sessions that the user has accepted but is not actively playing. Sessions in which the user is "ready" but not "active" count as inactive.
		 */
		inactive: "true" | "false";
		/**
		 * 	True to include private sessions. This parameter is only used when querying your own sessions, or when querying a specific user's sessions server-to-server.
		 */
		private: "true" | "false";
		/**
		 * Visibility state for the sessions. Possible values are defined by the MultiplayerSessionVisibility. If this parameter is set to "open", the query should include only open sessions. If it is set to "private", the private parameter must be set to true.
		 */
		visibility: string;
		/**
		 * The maximum session version that should be included. For example, a value of 2 specifies that only sessions with a major session version of 2 or less should be included. The version number must be less than or equal to the request's contract version mod 100.
		 */
		version: `${number}`;
		/**
		 * The maximum number of sessions to retrieve. This number must be between 0 and 100.
		 */
		take: `${number}`;
	}
}

class SessionDirectory {
	private readonly xbox: XboxLiveClient;
	static readonly uri: string = "https://sessiondirectory.xboxlive.com";
	constructor(xboxLiveInstance: XboxLiveClient) {
		this.xbox = xboxLiveInstance;
	}
	/**
	 * Creates queries for session handles that include related session information.
	 */
	async queryHandles(
		xuid: string,
		moniker: string,
		serviceConfigId?: string,
		includeRelatedInfo?: boolean
	): Promise<SessionDirectoryTypes.HandleQueryResult[]> {
		const res = await fetch(
			`${SessionDirectory.uri}/handles/query${
				includeRelatedInfo ? "?include=relatedInfo" : ""
			}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": "107",
				},
				body: JSON.stringify({
					owners: {
						people: {
							moniker: moniker ?? "people",
							monikerXuid: xuid,
						},
					},
					scid: serviceConfigId,
					type: "activity",
				}),
			}
		);
		//@ts-ignore
		let data: SessionDirectoryTypes.HandleQueryResponse = res.json();
		return data.results;
	}
	setActivity(sessionReference: XboxRestTypes.MultiplayerSessionReference) {
		return fetch(`${SessionDirectory.uri}/handles`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: this.xbox.tokenHeader,
				"x-xbl-contract-version": "107",
			},
			body: JSON.stringify({
				version: 1,
				type: "activity",
				sessionRef: sessionReference,
			}),
		});
	}

	invite(
		sessionReference: XboxRestTypes.MultiplayerSessionReference,
		inviteAttributes: XboxRestTypes.InviteAttributes
	) {
		return fetch(`${SessionDirectory.uri}/handles`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: this.xbox.tokenHeader,
				"x-xbl-contract-version": "107",
			},
			body: JSON.stringify({
				version: 1,
				type: "invite",
				sessionRef: sessionReference,
				inviteAttributes,
			}),
		});
	}

	/**
	 * This method creates, joins, or updates a session, depending on what subset of the same JSON request body template is sent. On success, it returns a MultiplayerSession object containing the response returned from the server. The attributes in it might be different from the attributes in the passed-in MultiplayerSession object.
	 */
	session(
		multiplayerSessionRequest: SessionDirectoryTypes.MultiplayerSessionRequest,
		serviceConfigId: string,
		sessionTemplateName: string,
		sessionName: string
	) {
		return fetch(
			`${SessionDirectory.uri}/serviceconfigs/${serviceConfigId}/sessionTemplates/${sessionTemplateName}/sessions/${sessionName}`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": "107",
				},
				body: JSON.stringify(multiplayerSessionRequest),
			}
		);
	}

	getSession(
		serviceConfigId: string,
		queries: SessionDirectoryTypes.SessionQueries
	) {
		return fetch(
			`${
				SessionDirectory.uri
			}/serviceconfigs/${serviceConfigId}/batch${new URLSearchParams(
				//@ts-ignore
				queries
			)})}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": "107",
				},
			}
		);
	}

	sessionKeepAlivePacket(
		serviceConfigId: string,
		sessionTemplateName: string,
		sessionName: string
	) {
		return fetch(
			`${SessionDirectory.uri}/serviceconfigs/${serviceConfigId}/sessionTemplates/${sessionTemplateName}/sessions/${sessionName}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": "107",
				},
			}
		);
	}

	removeMember(
		serviceConfigId: string,
		sessionTemplateName: string,
		sessionName: string,
		index: number
	) {
		return fetch(
			`${SessionDirectory.uri}/serviceconfigs/${serviceConfigId}/sessionTemplates/${sessionTemplateName}/sessions/${sessionName}/members/${index}`,
			{
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": "107",
				},
			}
		);
	}

	getTemplates(serviceConfigId: string) {
		return fetch(
			`${SessionDirectory.uri}/serviceconfigs/${serviceConfigId}/sessiontemplates`,

			{
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": "107",
				},
			}
		);
	}
	//Return
	removeServer(
		serviceConfigId: string,
		sessionTemplateName: string,
		sessionName: string,
		serverName: string
	) {
		return fetch(
			`${SessionDirectory.uri}/serviceconfigs/${serviceConfigId}/sessionTemplates/${sessionTemplateName}/sessions/${sessionName}/servers/${serverName}`,
			{
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": "107",
				},
			}
		);
	}

	batchQuery(
		serviceConfigId: string,

		xuids: string[],
		queries: SessionDirectoryTypes.SessionQueries
	) {
		return fetch(
			`${
				SessionDirectory.uri
			}/serviceconfigs/${serviceConfigId}/batch${new URLSearchParams(
				//@ts-ignore
				queries
			)}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": "107",
				},

				body: JSON.stringify({ xuids }),
			}
		);
	}
	deleteHandle(handleId: string) {
		return fetch(`${SessionDirectory.uri}/handles/${handleId}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				Authorization: this.xbox.tokenHeader,
				"x-xbl-contract-version": "107",
			},
		});
	}
	getHandle(handleId: string) {
		return fetch(`${SessionDirectory.uri}/handles/${handleId}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: this.xbox.tokenHeader,
				"x-xbl-contract-version": "107",
			},
		});
	}
}

export namespace PeopleHubTypes {
	export interface Person {
		xuid: string;
		isFavorite: boolean;
		isFollowingCaller: boolean;
		isFollowedByCaller: boolean;
		isIdentityShared: boolean;
		addedDateTimeUtc: unknown;
		displayName: string;
		realName: string;
		/**
		 * URL for the image
		 */
		displayPicRaw: string;
		showUserAsAvatar: string;
		gamertag: string;
		gamerScore: string;
		modernGamertag: string;
		modernGamertagSuffix: string;
		uniqueModernGamertag: string;
		xboxOneRep: string;
		presenceState: string;
		presenceText: string;
		presenceDevices: unknown;
		isBroadcasting: boolean;
		isCloaked: unknown;
		isQuarantined: boolean;
		isXbox360Gamerpic: boolean;
		lastSeenDateTimeUtc: string;
		suggestion: unknown;
		recommendation: unknown;
		search: unknown;
		titleHistory: unknown;
		multiplayerSummary: unknown;
		recentPlayer: unknown;
		follower: {
			text: string;
			followedDateTime: string;
		};
		preferredColor: unknown;
		presenceDetails: unknown;
		titlePresence: unknown;
		titleSummaries: unknown;
		presenceTitleIds: unknown;
		detail: unknown;
		communityManagerTitles: unknown;
		socialManager: unknown;
		broadcast: unknown;
		avatar: unknown;
		linkedAccounts: {
			networkName: string;
			displayName: string;
			showOnProfile: boolean;
			isFamilyFriendly: boolean;
			deeplink: unknown;
		}[];
		colorTheme: string;
		preferredFlag: string;
		preferredPlatforms: unknown[];
	}
	export interface PeopleList {
		people: Person[];
		recommendationSummary: unknown;
		friendFinderState: unknown;
		accountLinkDetails: unknown;
	}
}

class PeopleHub {
	private readonly xbox: XboxLiveClient;
	static readonly uri: string = "https://peoplehub.xboxlive.com";
	constructor(xboxLiveInstance: XboxLiveClient) {
		this.xbox = xboxLiveInstance;
	}
	async getFollowers(
		identifier?: UserIdentifier
	): Promise<PeopleHubTypes.PeopleList> {
		const res = await fetch(
			`${PeopleHub.uri}/users/${
				identifier ? parseIdentifier(identifier) : "me"
			}/people/followers`,
			{
				method: "GET",
				headers: {
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": "5",
					"Accept-Language": "en-us",
				},
			}
		);
		let data = await res.json();
		return data;
	}
}
import authPkg from "prismarine-auth";

import wsPkg, { ICloseEvent, IMessageEvent } from "websocket";
import fs from "fs";
const { Authflow, Titles } = authPkg;
const { w3cwebsocket: W3CWebSocket } = wsPkg;
import EventEmitter from "events";
import crypto from "crypto";
export class RTAMultiplayerSession extends EventEmitter {
	private readonly xbox: XboxLiveClient;
	readonly uri: string = "wss://rta.xboxlive.com";
	get sessionName() {
		return this.#sessionName;
	}
	#sessionName: string;
	protected connectionId: string;
	readonly sessionTemplateName: string;
	protected websocketConnected: boolean = false;
	readonly serviceConfigId: string;
	protected startTimes: number = 0;
	multiplayerSessionRequest: SessionDirectoryTypes.MultiplayerSessionRequest;
	members: Set<XboxLiveClient> = new Set<XboxLiveClient>();
	functionsToRunOnSessionUpdate: Set<() => void> = new Set();
	autoRestart: boolean;
	firstStartSignaled: boolean = false;
	private readonly updateSessionCallback: (
		rtaMultiplayerSession: RTAMultiplayerSession
	) => void;
	constructor(
		xbox: XboxLiveClient,
		multiplayerSessionRequest: SessionDirectoryTypes.MultiplayerSessionRequest,
		serviceConfigId: string,
		sessionTemplateName: string,
		autoRestart: boolean,
		updateSessionCallback: (
			rtaMultiplayerSession: RTAMultiplayerSession
		) => void
	) {
		super();
		this.updateSessionCallback = updateSessionCallback;
		this.multiplayerSessionRequest = multiplayerSessionRequest;
		this.serviceConfigId = serviceConfigId;
		this.sessionTemplateName = sessionTemplateName;
		this.xbox = xbox;

		if (autoRestart) this.autoRestart = true;

		setInterval(() => {
			if (this.websocketConnected && !this.xbox.isTokenRefreshing)
				for (let i of this.functionsToRunOnSessionUpdate) {
					i();
				}
		}, 27600);
		this.functionsToRunOnSessionUpdate.add(() => {
			this.updateSession();
		});
		this.start();
	}

	private start() {
		if (this.websocketConnected) return void 0;

		if (this.startTimes >= 5) {
			fs.unlinkSync(
				`${this.xbox.authPath}/${this.xbox.emailHash}_xbl-cache.json`
			);
			//fs.unlinkSync(`${this.xbox.authPath}/${this.xbox.emailHash}_live-cache.json`);
			this.startTimes = 0;
			setTimeout(() => {
				this.xbox.refreshToken(() => {
					this.emit("timeUntilStart");
					this.start();
					return void 0;
				});
			}, 29000);
		}
		this.#sessionName = crypto.randomUUID();
		this.startTimes++;
		const ws = new W3CWebSocket(
			`${this.uri}/connect`,
			"echo-protocol",
			undefined,
			{
				Authorization: this.xbox.tokenHeader,
			}
		);

		ws.onerror = (error: Error) => {
			this.websocketConnected = false;
			this.emit("error", error);
		};
		ws.onopen = () => {
			ws.send(
				'[1,1,"https://sessiondirectory.xboxlive.com/connections/"]'
			);

			this.websocketConnected = true;
			if (this.autoRestart) this.start();
			this.emit("open");
		};
		ws.onclose = (event: ICloseEvent) => {
			this.websocketConnected = false;
			if (this.autoRestart) this.start();
			this.emit("close", event);
		};
		ws.onmessage = (event: IMessageEvent) => {
			switch (typeof event.data) {
				case "string":
					if (event.data.includes("ConnectionId")) {
						this.connectionId = JSON.parse(
							event.data
						)[4].ConnectionId;
						//debug("connectionId: " + this.connectionId);
						this.updateSession();
					}
				default:
					this.emit("message", event.data);
			}
		};
	}
	updateSession() {
		//debug("updateSession called");
		if (this.updateSessionCallback) this.updateSessionCallback(this);

		//@ts-ignore
		this.multiplayerSessionRequest.members = {
			me: {
				constants: {
					system: {
						initialize: true,
						xuid: this.xbox.token.userXUID,
					},
				},
				properties: {
					system: {
						active: true,
						connection: this.connectionId,
						subscription: {
							changeTypes: ["everything"],
							id: "9042513B-D0CF-48F6-AF40-AD83B3C9EED4",
						},
					},
				},
			},
		};

		this.xbox.sessionDirectory
			.session(
				this.multiplayerSessionRequest,
				this.serviceConfigId,
				this.sessionTemplateName,
				this.#sessionName
			)
			.then(async res => {
				let data = await res.json();
				//debug("updateSessionCallback called");
				this.emit("sessionResponse", data);
				if (this.websocketConnected) {
					this.xbox.sessionDirectory
						.setActivity({
							scid: this.serviceConfigId,
							templateName: this.sessionTemplateName,
							name: this.#sessionName,
						})
						.then(async res => {
							this.emit("join", await res.text());
						});
				}
			});
	}

	join(xbox: XboxLiveClient) {
		this.functionsToRunOnSessionUpdate.add(() => {
			if (this.websocketConnected)
				xbox.sessionDirectory.sessionKeepAlivePacket(
					this.serviceConfigId,
					this.sessionTemplateName,
					this.#sessionName
				);
		});

		xbox.sessionDirectory
			.session(
				{
					//@ts-ignore
					members: {
						me: {
							constants: {
								system: {
									initialize: true,
									xuid: xbox.token.userXUID,
								},
							},
							properties: {
								system: {
									active: true,
									connection: this.connectionId,
									subscription: {
										changeTypes: ["everything"],
										id: "9042513B-D0CF-48F6-AF40-AD83B3C9EED4",
									},
								},
							},
						},
					},
				},
				this.serviceConfigId,
				this.sessionTemplateName,
				this.#sessionName
			)
			.finally(() => {
				xbox.sessionDirectory
					.setActivity({
						scid: this.serviceConfigId,
						templateName: this.sessionTemplateName,
						name: this.#sessionName,
					})
					.then(async res => {
						this.emit("join", await res.text());
					});
			});
	}
}
interface MsaResponse {
	userCode: string;
	deviceCode: string;
	verificationUri: string;
	expiresIn: number;
	interval: number;
	message: string;
}

namespace MultiplayerActivityTypes {}

class MultiplayerActivity {
	readonly xbox: XboxLiveClient;
	static readonly uri = "multiplayeractivity.xboxlive.com";
	constructor(xbox: XboxLiveClient) {
		this.xbox = xbox;
	}

	/**
	 * Sets or updates the activity for a user playing a specific title. This API allows a game client or server to set/update the multiplayer activity for a user playing a particular title. The activity must be set as soon as the user is active in a multiplayer activity. Xbox Live users will be able to subscribe to changes in activity for other users (generally friends) and these updates will be pushed to the Xbox clients via RTA.
	 *  @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/uri/multiplayeractivity/swagger-uris/uri-updateactivity
	 */
	setActivity(titleId: string, xuid: string) {
		return fetch(``, {
			headers: {
				Authorization: this.xbox.tokenHeader,
				"Content-Type": "string",
			},
		});
	}
	getActivity(titleId: string, xuid: string) {
		return fetch(``, {
			headers: {
				Authorization: this.xbox.tokenHeader,
				//"Content-Type": "application/text",
			},
		});
	}

	deleteActivity(titleId: string, xuid: string) {
		return fetch(``, {
			headers: {
				Authorization: this.xbox.tokenHeader,
				//"Content-Type": "string",
			},
		});
	}
}
import { createHash } from "prismarine-auth/src/common/Util.js";
import uniRest from "unirest";

export class XboxLiveClient extends EventEmitter {
	token: XboxLiveToken;
	#isTokenRefreshing: boolean = true;

	get isTokenRefreshing(): boolean {
		return this.#isTokenRefreshing;
	}
	authPath: string;
	liveCache: LiveCache;
	email: string;
	clientId: string;
	emailHash: string;

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
	get tokenHeader(): string {
		return `XBL3.0 x=${this.token.userHash};${this.token.XSTSToken}`;
	}
	readonly authOptions: authPkg.MicrosoftAuthFlowOptions;
	readonly social: Social;
	readonly sessionDirectory: SessionDirectory;
	readonly achievements: Achievements;
	protected firstTokenAcquired: boolean;
	readonly peopleHub: PeopleHub;
	static readonly uri = "https://login.live.com/oauth20_token.srf";
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
		this.emailHash = createHash(email);
		this.social = new Social(this);
		this.authPath = tokenPath || "./auth";
		this.sessionDirectory = new SessionDirectory(this);
		this.achievements = new Achievements(this);
		this.peopleHub = new PeopleHub(this);
		//@ts-ignore
		this.clientId = options.authTitle || "00000000441cc96b";
		this.on("msaAuthCodePrompt", (msa: MsaResponse) => {
			if (codeCallback) codeCallback(msa);
			console.log(
				msa.message,
				"\nPlease login with this email:",
				this.email
			);
		});
		this.refreshToken();
	}

	resetTokens(): void {
		fs.unlinkSync(`${this.authPath}/${this.emailHash}_xbl-cache.json`);
		fs.unlinkSync(`${this.authPath}/${this.emailHash}_live-cache.json`);
	}
	refreshToken(callback?: (token: XboxLiveToken) => void) {
		this.#isTokenRefreshing = true;
		if (!fs.existsSync(this.authPath))
			fs.mkdirSync(this.authPath, { recursive: true });
		let liveCache: LiveCache;
		try {
			liveCache = JSON.parse(
				fs.readFileSync(
					`${this.authPath}/${this.emailHash}_live-cache.json`,
					"utf8"
				)
			);
		} catch {
			return this.getToken(callback);
		}
		if (!liveCache.token) {
			if (this.liveCache) {
				liveCache = this.liveCache;
			} else return this.getToken();
		}

		const req = uniRest("POST", XboxLiveClient.uri);
		req.headers({
			"Content-Type": "application/x-www-form-urlencoded",
		});
		req.form({
			scope: liveCache.token.scope,
			client_id: this.clientId,
			grant_type: "refresh_token",
			refresh_token: liveCache.token.refresh_token,
		});
		req.end(res => {
			this.liveCache = {
				token: { ...res.body, obtainedOn: Date.now() },
			};
			//console.log(this.liveCache);
			fs.writeFileSync(
				`${this.authPath}/${this.emailHash}_live-cache.json`,
				JSON.stringify(this.liveCache),
				"utf8"
			);

			if (
				fs.existsSync(
					`${this.authPath}/${this.emailHash}_xbl-cache.json`
				)
			)
				fs.unlinkSync(
					`${this.authPath}/${this.emailHash}_xbl-cache.json`
				);

			this.getToken(callback);
		});
	}

	private setRefreshInterval() {
		let expiry = this.liveCache.token.expires_in * 1000;
		expiry += this.liveCache.token.obtainedOn;
		setInterval(() => {
			if (expiry - Date.now() - 3600000 < 0) this.refreshToken();
		}, 900000);
	}

	getToken(callback?: (token: XboxLiveToken) => void) {
		//debug(this.email, this.authPath, this.authOptions);

		new Authflow(
			this.email,
			this.authPath,
			this.authOptions,
			(res: MsaResponse) => {
				//debug(`getToken msa code`);
				this.emit("msaAuthCodePrompt", res);
			}
		)
			.getXboxToken()
			.then((token: XboxLiveToken) => {
				this.token = token;
				this.liveCache = JSON.parse(
					fs.readFileSync(
						`${this.authPath}/${this.emailHash}_live-cache.json`,
						"utf8"
					)
				);
				this.#isTokenRefreshing = false;
				if (callback) callback(token);
				if (!this.firstTokenAcquired) {
					this.setRefreshInterval();
					this.emit("firstTokenAcquired");
				}
				this.firstTokenAcquired = true;
				this.emit("token", token);
			});
	}
}

interface LiveCache {
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
