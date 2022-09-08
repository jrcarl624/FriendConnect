import crypto from "crypto";
import { EventEmitter } from "events";
import fs from "fs";
import https, { RequestOptions } from "https";
import uniRest from "unirest";
import {
	ping,
	createServer,
	ServerAdvertisement,
	Client,
	Server,
} from "bedrock-protocol";

import { createHash } from "prismarine-auth/src/common/Util.js";

import authPkg from "prismarine-auth";

const { Authflow, Titles } = authPkg;
import { config } from "dotenv";
import wsPkg, { ICloseEvent, IMessageEvent } from "websocket";
import { ClientRequest, IncomingMessage } from "http";
const { w3cwebsocket: W3CWebSocket } = wsPkg;
config();
const Constants = {
	SERVICE_CONFIG_ID: "4fc10100-5f7a-4470-899b-280835760c07", // The service config ID for Minecraft
	LIVE_TOKEN_REQUEST: "https://login.live.com/oauth20_token.srf",
	CLIENT_ID: "00000000441cc96b", // Nintendo Switch Title ID
};

const debug = (...args: any[]) => {
	if (process.env.FRIEND_CONNECT_DEBUG) {
		for (let i of args) {
			try {
				JSON.stringify(JSON.parse(args[i]), undefined, 4);
			} catch (e) {
				console.log(i);
			}
		}
	}
};

const debugWrite = (
	fileName: fs.PathOrFileDescriptor,
	data: string | NodeJS.ArrayBufferView
) => {
	if (process.env.FRIEND_CONNECT_DEBUG) {
		if (!fs.existsSync("./temp")) fs.mkdirSync("./temp");
		fs.writeFileSync("./temp/" + fileName, data);
	}
};

interface HttpRequestOptions extends RequestOptions {
	body?: string | Record<string, any>;
}

const request = (
	url: string | URL,
	options: HttpRequestOptions,
	callback: (response: IncomingMessage) => void
) => {
	if (typeof options.body == "object") {
		options.body = JSON.stringify(options.body);
		options.headers = options.headers || {};
		options.headers["Content-Type"] = "application/json";
	}

	const req = https.request(url, options, res => {
		res.on("data", data => {
			debug(res.statusCode);
			if (process.env.FRIEND_CONNECT_DEBUG)
				try {
					console.log(JSON.parse(data));
				} catch {
					console.log(data.toString());
				}
		});

		if (callback) callback(res);
	});
	if (options.body) req.write(options.body);

	return req;
};

const setQueries = (url: string, queries: Record<string, any>) => {
	url += "?";
	for (let i in queries) url += `${i}=${queries[i]}&`;
	return url.slice(url.lastIndexOf("&"), url.lastIndexOf("&"));
};

type ResponseCallback = (response: IncomingMessage) => void;

interface MinecraftLobbySessionRequestOptions {
	properties: {
		system: {
			joinRestriction: "followed" | "local"; // Only present if 'visibility' is "open" or "full" and the session has a join restriction.
			readRestriction: "followed";
			closed: boolean;
		};
		custom: MinecraftLobbyCustomProperties;
	};
	members: {
		me: {
			constants: {
				system: {
					xuid: string;
					initialize: true;
				};
			};
			properties: {
				system: {
					active: true;
					connection: string; // connectionId
					subscription: {
						id: "845CC784-7348-4A27-BCDE-C083579DD113";
						changeTypes: ["everything"];
					};
				};
			};
		};
	};
}

interface XboxLiveToken {
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

const joinChunks = (res: IncomingMessage, callback: (body: string) => void) => {
	let chunks = "";

	res.on("data", chunk => {
		//console.log(chunk.toString());
		chunks += chunk;
	});

	res.on("end", () => {
		callback(chunks);
	});
};

class Social {
	private readonly xbox: XboxLiveClient;
	readonly uri: string = "https://social.xboxlive.com";
	constructor(xboxLiveInstance: XboxLiveClient) {
		this.xbox = xboxLiveInstance;
	}
	getFriends(callback: ResponseCallback): ClientRequest {
		return request(
			`${this.uri}/users/me/people`,
			{
				method: "GET",
				headers: {
					Authorization: this.xbox.tokenHeader,
				},
			},
			callback
		).end();
	}
	addFriend(xuid: string, callback?: ResponseCallback): ClientRequest {
		return request(
			`${this.uri}/users/me/people/xuid(${xuid})`,
			{
				method: "PUT",
				headers: {
					Authorization: this.xbox.tokenHeader,
				},
			},
			callback
		).end();
	}
	removeFriend(xuid: string, callback?: ResponseCallback) {
		return request(
			`${this.uri}/users/me/people/xuid(${xuid})`,
			{
				method: "DELETE",
				headers: {
					Authorization: this.xbox.tokenHeader,
				},
			},
			callback
		).end();
	}
	getProfile(xuid: string, callback?: (person: SocialTypes.Person) => void) {
		return request(
			`${this.uri}/users/me/people/xuid(${xuid})`,
			{
				method: "GET",
				headers: {
					Authorization: this.xbox.tokenHeader,
				},
			},
			res => {
				joinChunks(res, data => {
					callback(JSON.parse(data));
				});
			}
		).end();
	}
	getProfileSummary(
		xuid: string,
		callback?: (summary: SocialTypes.PersonSummary) => void
	) {
		return request(
			`${this.uri}/users/xuid(${xuid})/summary`,
			{
				method: "GET",
				headers: {
					Authorization: this.xbox.tokenHeader,
				},
			},
			res => {
				joinChunks(res, data => {
					callback(JSON.parse(data));
				});
			}
		).end();
	}
}

/**
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-achievementv2s
 */
interface Achievement {
	id: number;
	serviceConfigId: string;
	name: string;
	titleAssociations: {
		name: string;
		id: number;
		version: string;
	}[];
	progressState: string;
	progression: {
		requirements: {
			id: string;
			current: unknown;
			target: string;
		}[];
		timeUnlocked: string;
	};
	mediaAssets: {
		name: string;
		type: string;
		url: string;
	}[];
	platform: string;
	isSecret: true;
	description: string;
	lockedDescription: string;
	productId: string;
	achievementType: string;
	participationType: string;
	timeWindow: {
		startDate: string;
		endDate: string;
	};
	rewards: {
		name: unknown;
		description: unknown;
		value: string;
		type: string;
		valueType: string;
	}[];
	estimatedTime: string;
	deeplink: string;
	isRevoked: false;
}
class Achievements {
	private readonly xbox: XboxLiveClient;
	readonly uri: string = "https://achievements.xboxlive.com";
	constructor(xboxLiveInstance: XboxLiveClient) {
		this.xbox = xboxLiveInstance;
	}

	get(callback: (achievements: Achievement[]) => void): ClientRequest {
		return request(
			`${this.uri}/users/xuid(${this.xbox.token.userXUID})/achievements`,
			{
				method: "GET",
				headers: {
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": "5",
					"Content-Length": "7",
				},
			},
			res => {
				joinChunks(res, data => {
					callback(JSON.parse(data).achievements);
				});
			}
		).end();
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

	export interface MultiplayerActivityDetails {
		id: string;
		type: "activity";
		version: 1;
		sessionRef: MultiplayerSessionReference;
		/**
		 * 	The title ID that should be launched in order to join the activity.
		 */
		titleId: string;
		/**
		 * Xbox user ID of the member who owns the activity.
		 */
		ownerXuid: string;
		/**
		 * The handle ID corresponding to the activity.
		 */
		handleID: string;
		/**
		 * Only if ?include=relatedInfo
		 */
		relatedInfo?: {
			/**
			 * 	A Microsoft.Xbox.Services.Multiplayer.MultiplayerSessionVisibility value indicating the visibility state of the session.
			 */
			visibility: string | "open";
			/**
			 * A Microsoft.Xbox.Services.Multiplayer.MultiplayerSessionJoinRestriction value indicating the join restriction for the session. This restriction applies if the visiblity field is set to "open".
			 */
			joinRestriction: string | "followed";
			/**
			 * True if the session is temporarily closed for joining, and false otherwise.
			 */
			closed: boolean;
			/**
			 * Number of total slots.
			 */
			maxMembersCount: number;
			/**
			 * Number of slots occupied.
			 */
			membersCount: number;
		};
	}
	/**
	 * A Microsoft.Xbox.Services.Multiplayer.MultiplayerSessionReference object representing identifying information for the session.
	 */
	export interface MultiplayerSessionReference {
		/**
		 * Service configuration identifier (SCID). Part 1 of the session identifier.
		 *  @type {GUID}
		 */
		scid: string;
		/**
		 * Name of the current instance of the session template. Part 2 of the session identifier.
		 */
		templateName: string;
		/**
		 * Name of the session. Part 3 of the session identifier.
		 * The session name is optional in a POST; if not specified, MPSD fills in a GUID.
		 */
		name: string;
	}

	export interface InviteAttributes {
		/**
		 * The title being invited to, in decimal uint32. This value is used to find the title name and/or image.
		 */
		titleId: string;
		/**
		 * The title defined context token. Must be 256 characters or less when URI-encoded.
		 */
		context: string;
		/**
		 * The string name of a custom invite string to display in the invite notification.
		 * */
		contextString: string;
		/**
		 * The string name of the sender when the sender is a service.
		 */
		senderString: string;
	}

	export interface InviteHandleRequest {
		id: string;
		version: number | 1;
		type: "invite";
		sessionRef: MultiplayerSessionReference;
		inviteAttributes: InviteAttributes;
		invitedXuid: string;
	}

	export interface HandleRequest {
		version: 1;
		type: "activity";
		sessionRef: MultiplayerSessionReference;
	}

	export interface MultiplayerSession {
		properties: {
			system: {
				turn: [];
				[key: string]: any;
			};
			custom: {
				[key: string]: any;
			};
		};
		constants: {
			system: {
				visibility: string;
				[key: string]: any;
			};
			custom: { [key: string]: any };
		};
		servers: {};
		members: {
			first: number;
			end: number;
			count: number;
			accepted: number;
			[key: `${number}`]: {
				next: 1;
				pending: true;
				properties: {
					system: { [key: string]: any };
					custom: { [key: string]: any };
				};
				constants: {
					system: {
						xuid: string;
					};
					custom: {
						[key: string]: any;
					};
				};
			};
		};
		key: string;
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
		reservations: boolean;
		/**
		 *	True to include sessions that the user has accepted but is not actively playing. Sessions in which the user is "ready" but not "active" count as inactive.
		 */
		inactive: boolean;
		/**
		 * 	True to include private sessions. This parameter is only used when querying your own sessions, or when querying a specific user's sessions server-to-server.
		 */
		private: boolean;
		/**
		 * Visibility state for the sessions. Possible values are defined by the MultiplayerSessionVisibility. If this parameter is set to "open", the query should include only open sessions. If it is set to "private", the private parameter must be set to true.
		 */
		visibility: string;
		/**
		 * The maximum session version that should be included. For example, a value of 2 specifies that only sessions with a major session version of 2 or less should be included. The version number must be less than or equal to the request's contract version mod 100.
		 */
		version: number;
		/**
		 * The maximum number of sessions to retrieve. This number must be between 0 and 100.
		 */
		take: number;
	}
}

class SessionDirectory {
	private readonly xbox: XboxLiveClient;
	readonly uri: string = "https://sessiondirectory.xboxlive.com";
	constructor(xboxLiveInstance: XboxLiveClient) {
		this.xbox = xboxLiveInstance;
	}

	queryHandles(
		ownerXuid: string,
		callback: ResponseCallback,
		serviceConfigId?: string
	): ClientRequest {
		return request(
			`${this.uri}/handles`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": 107,
				},
				body: {
					owners: {
						people: {
							moniker: "people",
							monikerXuid: ownerXuid,
						},
					},
					scid: serviceConfigId,
					type: "activity",
				},
			},
			callback
		).end();
	}
	setActivity(
		sessionReference: SessionDirectoryTypes.MultiplayerSessionReference,
		callback?: ResponseCallback
	): ClientRequest {
		return request(
			`${this.uri}/handles`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": 107,
				},
				body: {
					version: 1,
					type: "activity",
					sessionRef: sessionReference,
				},
			},
			callback
		).end();
	}

	invite(
		sessionReference: SessionDirectoryTypes.MultiplayerSessionReference,
		inviteAttributes: SessionDirectoryTypes.InviteAttributes,
		callback?: ResponseCallback
	): ClientRequest {
		return request(
			`${this.uri}/handles`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": 107,
				},
				body: {
					version: 1,
					type: "invite",
					sessionRef: sessionReference,
					inviteAttributes,
				},
			},
			callback
		).end();
	}

	/**
	 * This method creates, joins, or updates a session, depending on what subset of the same JSON request body template is sent. On success, it returns a MultiplayerSession object containing the response returned from the server. The attributes in it might be different from the attributes in the passed-in MultiplayerSession object.
	 * @param multiplayerSessionRequest
	 * @param serviceConfigId
	 * @param sessionTemplateName
	 * @param sessionName
	 * @param callback
	 * @returns {ClientRequest}
	 */
	session(
		multiplayerSessionRequest: SessionDirectoryTypes.MultiplayerSessionRequest,
		serviceConfigId: string,
		sessionTemplateName: string,
		sessionName: string,
		callback?: ResponseCallback
	): ClientRequest {
		//if (sessionInfo && sessionInfo.log) console.log("updateSession");

		//console.log(createSessionContent);

		//console.log(options);
		return request(
			`${this.uri}/serviceconfigs/${serviceConfigId}/sessionTemplates/${sessionTemplateName}/sessions/${sessionName}`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": 107,
				},
				body: multiplayerSessionRequest,
			},
			callback
		).end();
	}

	getSession(
		serviceConfigId: string,
		queries: SessionDirectoryTypes.SessionQueries,
		callback?: ResponseCallback
	): ClientRequest {
		//if (sessionInfo && sessionInfo.log) console.log("updateSession");

		//console.log(createSessionContent);

		//console.log(options);

		return request(
			setQueries(
				`${this.uri}/serviceconfigs/${serviceConfigId}/batch`,
				queries
			),
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": 107,
				},
			},
			callback
		).end();
	}

	sessionKeepAlivePacket(
		serviceConfigId: string,
		sessionTemplateName: string,
		sessionName: string,
		callback?: ResponseCallback
	): ClientRequest {
		//if (sessionInfo && sessionInfo.log) console.log("updateSession");

		//console.log(createSessionContent);

		//console.log(options);
		return request(
			`${this.uri}/serviceconfigs/${serviceConfigId}/sessionTemplates/${sessionTemplateName}/sessions/${sessionName}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": 107,
				},
			},
			callback
		).end();
	}

	removeMember(
		serviceConfigId: string,
		sessionTemplateName: string,
		sessionName: string,
		index: number,
		callback?: ResponseCallback
	): ClientRequest {
		//if (sessionInfo && sessionInfo.log) console.log("updateSession");

		//console.log(createSessionContent);

		//console.log(options);
		return request(
			`${this.uri}/serviceconfigs/${serviceConfigId}/sessionTemplates/${sessionTemplateName}/sessions/${sessionName}/members/${index}`,
			{
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": 107,
				},
			},
			callback
		).end();
	}

	getTemplates(
		serviceConfigId: string,
		callback?: ResponseCallback
	): ClientRequest {
		//if (sessionInfo && sessionInfo.log) console.log("updateSession");

		//console.log(createSessionContent);

		//console.log(options);

		return request(
			`${this.uri}/serviceconfigs/${serviceConfigId}/sessiontemplates`,

			{
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": 107,
				},
			},
			callback
		).end();
	}
	//Return
	removeServer(
		serviceConfigId: string,
		sessionTemplateName: string,
		sessionName: string,
		serverName: string,
		callback?: ResponseCallback
	): ClientRequest {
		//if (sessionInfo && sessionInfo.log) console.log("updateSession");

		//console.log(createSessionContent);

		//console.log(options);
		return request(
			`${this.uri}/serviceconfigs/${serviceConfigId}/sessionTemplates/${sessionTemplateName}/sessions/${sessionName}/servers/${serverName}`,
			{
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": 107,
				},
			},
			callback
		).end();
	}

	batchQuery(
		serviceConfigId: string,

		xuids: string[],
		queries: SessionDirectoryTypes.SessionQueries,
		callback?: ResponseCallback
	): ClientRequest {
		//if (sessionInfo && sessionInfo.log) console.log("updateSession");

		//console.log(createSessionContent);

		//console.log(options);

		return request(
			setQueries(
				`${this.uri}/serviceconfigs/${serviceConfigId}/batch`,
				queries
			),
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": 107,
				},
				body: JSON.stringify({ xuids }),
			},
			callback
		).end();
	}
	deleteHandle(handleId: string, callback?: ResponseCallback): ClientRequest {
		return request(
			`${this.uri}/handles/${handleId}`,
			{
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": 107,
				},
			},
			callback
		).end();
	}
	getHandle(handleId: string, callback?: ResponseCallback): ClientRequest {
		return request(
			`${this.uri}/handles/${handleId}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": 107,
				},
			},
			callback
		).end();
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
	readonly uri: string = "https://peoplehub.xboxlive.com";
	constructor(xboxLiveInstance: XboxLiveClient) {
		this.xbox = xboxLiveInstance;
	}
	getFollowers(
		callback?: (peopleList: string) => void,
		xuid?: string
	): ClientRequest {
		return request(
			`${this.uri}/users/${
				xuid ? `xuid(${xuid})` : "me"
			}/people/followers`,
			{
				method: "GET",
				headers: {
					Authorization: this.xbox.tokenHeader,
					"x-xbl-contract-version": 5,
					"Accept-Language": "en-us",
				},
			},
			res => {
				joinChunks(res, body => {
					callback(body);
				});
			}
		).end();
	}
}

class RTAMultiplayerSession extends EventEmitter {
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

		this.xbox.sessionDirectory.session(
			this.multiplayerSessionRequest,
			this.serviceConfigId,
			this.sessionTemplateName,
			this.#sessionName,
			res => {
				res.on("data", data => {
					//debug("updateSessionCallback called");
					this.emit("sessionResponse", data.toString());
					if (this.websocketConnected) {
						this.xbox.sessionDirectory.setActivity(
							{
								scid: this.serviceConfigId,
								templateName: this.sessionTemplateName,
								name: this.#sessionName,
							},
							res => {
								res.on("data", data => {
									this.emit("join", data.toString());
								});
							}
						);
					}
				});
			}
		);
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

		xbox.sessionDirectory.session(
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
			this.#sessionName,
			() => {
				xbox.sessionDirectory.setActivity(
					{
						scid: this.serviceConfigId,
						templateName: this.sessionTemplateName,
						name: this.#sessionName,
					},
					res => {
						res.on("data", data => {
							this.emit("join", data.toString());
						});
					}
				);
			}
		);
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
	uri: "multiplayeractivity.xboxlive.com" =
		"multiplayeractivity.xboxlive.com";
	constructor(xbox: XboxLiveClient) {
		this.xbox = xbox;
	}

	/**
	 * Sets or updates the activity for a user playing a specific title. This API allows a game client or server to set/update the multiplayer activity for a user playing a particular title. The activity must be set as soon as the user is active in a multiplayer activity. Xbox Live users will be able to subscribe to changes in activity for other users (generally friends) and these updates will be pushed to the Xbox clients via RTA.
	 *  @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/uri/multiplayeractivity/swagger-uris/uri-updateactivity
	 */
	setActivity(titleId: string, xuid: string, callback: ResponseCallback) {
		return request(
			``,
			{
				headers: {
					Authorization: this.xbox.tokenHeader,
					"Content-Type": "string",
				},
			},
			callback
		);
	}
	getActivity(titleId: string, xuid: string, callback: ResponseCallback) {
		return request(
			``,
			{
				headers: {
					Authorization: this.xbox.tokenHeader,
					"Content-Type": "string",
				},
			},
			callback
		);
	}

	deleteActivity(titleId: string, xuid: string, callback: ResponseCallback) {
		return request(
			``,
			{
				headers: {
					Authorization: this.xbox.tokenHeader,
					"Content-Type": "string",
				},
			},
			callback
		);
	}
}

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
		if (process.env.FRIEND_CONNECT_DEBUG)
			debugWrite(
				`tokenHeader_${this.email}.txt`,
				`XBL3.0 x=${this.token.userHash};${this.token.XSTSToken}`
			);
		return `XBL3.0 x=${this.token.userHash};${this.token.XSTSToken}`;
	}
	readonly authOptions: authPkg.MicrosoftAuthFlowOptions;
	readonly social: Social;
	readonly sessionDirectory: SessionDirectory;
	readonly achievements: Achievements;
	protected firstTokenAcquired: boolean;
	readonly peopleHub: PeopleHub;

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

		const req = uniRest("POST", Constants.LIVE_TOKEN_REQUEST);
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

interface SessionOptionsConstants {
	gamemode?: boolean;
	protocol?: boolean;
	version?: boolean;
	worldName?: boolean;
	hostName?: boolean;
	maxConnectedPlayers?: boolean;
	connectedPlayers?: boolean;
}

interface AdditionalSessionOptions {
	autoFriending?: boolean;
	log?: boolean;
	constants?: SessionOptionsConstants;
	pingServerForInfo?: boolean;
}

interface FriendConnectSessionInfoOptions {
	/**
	 * The name of the server, this can be up to 35 characters long but I would stay to a maximum of 26-27
	 */
	hostName: string;
	/**
	 * The subheader of the server name, use this as the motd (message of the day). I would stay at a maximum of 24 ish characters long
	 */
	worldName: string;
	/**
	 * A string that can be any value that is in the place of the version
	 */
	version: string;
	/**
	 * The path to the directory that the authentication tokens are stored.
	 */
	tokenPath: string;
	/**
	 * The protocol number that corresponds which versions of the game can join
	 */

	joinability: "joinable_by_friends";
	pingServerForInfo?: boolean;
	protocol: number;
	connectedPlayers: number;
	maxConnectedPlayers: number;
	ip: string;
	port: number;
	log?: boolean;
	connectionType: number;
	autoFriending?: boolean;
	constants?: SessionOptionsConstants;
	accounts: string[];
}
interface MinecraftLobbyCustomProperties {
	BroadcastSetting: number;
	CrossPlayDisabled: boolean;
	Joinability: string | "joinable_by_friends";
	LanGame: boolean;
	MaxMemberCount: number;
	MemberCount: number;
	OnlineCrossPlatformGame: boolean;
	SupportedConnections: {
		ConnectionType: number;
		HostIpAddress: string;
		HostPort: number;
		RakNetGUID: string;
	}[];
	TitleId: number;
	TransportLayer: number;
	levelId: string;
	hostName: string;
	ownerId: string;
	rakNetGUID: string;
	worldName: string;
	worldType: string;
	protocol: number;
	version: string;
}

//TODO add events to the social class the emits friendAdded on response so there is no duplicateEvents same for other events. also clean up the code for the xbox live client so it returns the values instead of a response
class Session extends EventEmitter {
	public xboxAccounts: Map<string, XboxLiveClient> = new Map();
	public hostAccount: XboxLiveClient;

	#sessionInstance: RTAMultiplayerSession;
	get sessionInstance(): RTAMultiplayerSession {
		return this.#sessionInstance;
	}
	public minecraftLobbyCustomOptions: MinecraftLobbyCustomProperties;
	#friendXuids: Set<string> = new Set();
	get friendXuids(): IterableIterator<string> {
		return this.#friendXuids.values();
	}

	public additionalOptions: AdditionalSessionOptions = {};
	#accountXuids: Set<string> = new Set();

	get accountXuids(): IterableIterator<string> {
		return this.#accountXuids.values();
	}
	public fullOfFriends: Set<string> = new Set();

	#accountsInitialized: number = 0;
	#accountsWithNoAchievements: number = 0;
	started: boolean = false;
	constructor(options: FriendConnectSessionInfoOptions) {
		super();

		if (!options.accounts)
			throw new Error("`accounts` is required in Session()");

		if (!options.connectionType)
			throw new Error("`connectionType` is required in Session()");

		if (!options.ip) throw new Error("`ip` is required in Session()");

		if (!options.port) throw new Error("`port` is required in Session()");

		if (!options.tokenPath) options.tokenPath = "./auth/";

		if (!options.hostName) options.hostName = "";

		if (!options.worldName) options.worldName = "";

		if (options.log) this.additionalOptions.log = true;

		options.joinability = options.joinability || "joinable_by_friends";

		if (options.pingServerForInfo)
			this.additionalOptions.pingServerForInfo = true;

		if (options.autoFriending) this.additionalOptions.autoFriending = true;
		this.additionalOptions.constants =
			options.constants || ({} as SessionOptionsConstants);
		this.getAdvertisement();

		if (!/.[\/]?[a-zA-Z0-9]+[\/]?/.test(options.tokenPath))
			throw new Error("`tokenPath` is invalid, use ./auth/ for example");

		this.initializeAccounts(options.accounts, options.tokenPath);

		this.on("accountInitialized", () => {
			if (this.#accountsInitialized >= options.accounts.length)
				this.checkAchievements(this.xboxAccounts.values());
		});
		this.on("achievementChecked", () => {
			if (this.#accountsWithNoAchievements >= options.accounts.length)
				this.emit("accountsDoNotHaveAchievements");
			//debug(this.accountsWithNoAchievements);
		});

		this.on("accountsDoNotHaveAchievements", () => {
			this.duplicateFriendCheck(() => {
				this.emit("gotFriends?");
			});
		});

		this.on("gotFriends?", () => {
			if (this.#sessionInstance) return void 0;
			if (this.additionalOptions.autoFriending)
				this.setFriendInterval(this.xboxAccounts.values());

			if (this.xboxAccounts.size != 1) {
				setInterval(() => {
					if (!this.doingAutoFriendInterval)
						try {
							this.duplicateFriendCheck();
						} catch (error) {
							this.errorHandling(
								error,
								undefined,
								"Friend Duplicate Checking"
							);
						}
				}, 1800000);
			}

			for (const i of this.xboxAccounts.values()) {
				if (!this.hostAccount) this.hostAccount = i;
				for (let j of this.xboxAccounts.values()) {
					debug(i.email, j.email);
					if (i != j)
						i.social.addFriend(j.token.userXUID, res => {
							debug(res.statusCode);
							this.#friendXuids.add(j.token.userXUID);
							res.on("data", data => {
								debug(data);
							});
						});
				}
			}

			const log = (...message: any[]) => {
				if (this.additionalOptions.log)
					console.log(
						`[FriendConnect ${this.hostAccount.email}]`,
						...message,
						"\n"
					);
			};
			log("Starting...");

			//debug("accountsDoNotHaveAchievements");
			this.minecraftLobbyCustomOptions =
				this.createMinecraftLobbyCustomProperties(
					this.hostAccount,
					options
				);
			setInterval(() => {
				if (this.additionalOptions.pingServerForInfo)
					this.getAdvertisement();
			}, 15000);
			//debug(request);
			this.#sessionInstance = new RTAMultiplayerSession(
				this.hostAccount,
				//@ts-ignore
				{
					properties: {
						system: {
							joinRestriction: "followed",
							readRestriction: "followed",
							closed: false,
						},
						custom: this.minecraftLobbyCustomOptions,
					},
				},
				Constants.SERVICE_CONFIG_ID,
				"MinecraftLobby",
				true,
				session => {
					session.multiplayerSessionRequest.properties.custom =
						this.minecraftLobbyCustomOptions;
				}
			);

			this.#sessionInstance.on("message", (event: IMessageEvent) => {
				log(event);
			});

			this.#sessionInstance.on("open", () => {
				log("Connected to RTA Websocket");
				this.started = true;
			});
			this.#sessionInstance.on("close", (event: ICloseEvent) => {
				log(event.code);
				log(event.reason);
				log(event.wasClean);
				log("Restarting...");
				this.started = false;
			});
			this.#sessionInstance.on("error", (error: Error) => {
				this.errorHandling(
					error,
					this.hostAccount.email,
					"RTA Websocket"
				);
				log("Restarting...");
				this.started = false;
			});

			let firstResponse = true;
			this.#sessionInstance.on("sessionResponse", session => {
				if (firstResponse) {
					for (let i of this.xboxAccounts.values()) {
						if (i == this.hostAccount) continue;
						this.#sessionInstance.join(i);
						firstResponse = false;
					}
				}
				session = JSON.parse(session);

				if (Object.keys(session.members).length > 35) {
					for (let i in session.members) {
						let member = session.members[i];
						console.log(session.members[i]);
						if (
							this.#accountXuids.has(
								session.members[i].constants.system.xuid
							)
						)
							continue;

						if (
							Date.now() + 300000 - Date.parse(member.joinTime) <
							0
						)
							this.hostAccount.sessionDirectory.removeMember(
								this.#sessionInstance.serviceConfigId,
								this.#sessionInstance.sessionTemplateName,
								this.#sessionInstance.sessionName,
								parseInt(i)
							);
					}
				}
			});
		});
	}

	doingDuplicateFriendCheck: boolean;

	duplicateFriendCheck(callback?: () => void) {
		this.doingDuplicateFriendCheck = true;
		let friendsGot = 0;
		let friendXuids = new Map<string, Set<string>>();

		for (let account of this.xboxAccounts.values()) {
			if (this.additionalOptions.log)
				console.log(
					`[FriendConnect ${account.email}] Duplicate Friend Check Interval`
				);
			this.#accountXuids.add(account.token.userXUID);
			https
				.request(
					`https://social.xboxlive.com/users/me/people`,
					{
						method: "GET",
						headers: {
							Authorization: account.tokenHeader,
						},
					},
					res => {
						let friends = "";
						res.on("data", data => {
							friends += data;
						});

						res.on("end", () => {
							let friendsList: SocialTypes.PeopleList =
								JSON.parse(friends);
							friendXuids.set(account.token.userXUID, new Set());
							if (friendsList.totalCount == 1000) {
								this.fullOfFriends.add(account.token.userXUID);
								return void 0;
							} else if (
								this.fullOfFriends.has(account.token.userXUID)
							) {
								this.fullOfFriends.delete(
									account.token.userXUID
								);
							}
							for (let person of friendsList.people) {
								if (!person.isFollowingCaller) {
									account.social.removeFriend(person.xuid);
									this.#friendXuids.delete(person.xuid);

									if (this.additionalOptions.log)
										console.log(
											`[FriendConnect ${account.email}] Removed Friend ${person.xuid}`
										);
									this.emit("friendRemoved", {
										account,
										xuid: person.xuid,
									});
								} else {
									friendXuids
										.get(account.token.userXUID)
										.add(person.xuid);
									this.#friendXuids.add(person.xuid);
								}
							}
							friendsGot++;
							this.emit("doFriendCheck");
						});
					}
				)
				.end();
		} //xuid, Record<string,boolean>
		this.on("doFriendCheck", () => {
			let duplicateMap = new Map<string, Set<string>>();
			if (friendsGot == this.xboxAccounts.size) {
				for (let email1 of friendXuids.keys()) {
					let array1 = friendXuids.get(email1);
					for (let email2 of friendXuids.keys()) {
						let array2 = friendXuids.get(email2);
						for (let xuid of array2) {
							if (array1.has(xuid)) {
								let dupEmailRecord = duplicateMap.get(xuid);
								if (!dupEmailRecord) dupEmailRecord = new Set();
								dupEmailRecord.add(email1);
								dupEmailRecord.add(email2);
							}
						}
					}
				}

				for (let personXuid of duplicateMap.keys()) {
					let emailSet: Set<string> = duplicateMap.get(personXuid);
					let skipEmail: boolean = true;
					for (let j of emailSet) {
						if (skipEmail) {
							skipEmail = false;
							continue;
						}

						let account = this.xboxAccounts.get(j);
						if (!this.#accountXuids.has(personXuid)) {
							account.social.removeFriend(personXuid);
							this.#friendXuids.delete(personXuid);

							console.log(
								`[FriendConnect ${account.email}] Removed Friend ${personXuid}`
							);
							this.emit("friendRemoved", {
								account,
								person: personXuid,
							});
						}
					}
				}

				this.doingDuplicateFriendCheck = false;
				if (callback) callback();
			}
		});
	}

	initializeAccounts(accountEmails: string[], tokenPath: string): void {
		this.#accountsInitialized = 0;
		for (let email of accountEmails) {
			//debug("Accounts initialized: " + this.accountsInitialized);
			let xbox = new XboxLiveClient(email, tokenPath, {
				authTitle: Titles.MinecraftNintendoSwitch,
				deviceType: "Nintendo",
			});
			if (this.additionalOptions.log)
				console.log(
					`[FriendConnect ${xbox.email}] Initializing Account`
				);
			xbox.on("firstTokenAcquired", () => {
				this.xboxAccounts.set(xbox.token.userXUID, xbox);
				this.#accountsInitialized++;
				if (this.additionalOptions.log)
					console.log(
						`[FriendConnect ${xbox.email}] Account Initialized`
					);
				this.emit("accountInitialized");
			});
		}
	}
	checkAchievements(accounts: IterableIterator<XboxLiveClient>): void {
		for (let account of accounts) {
			if (this.additionalOptions.log)
				console.log(
					`[FriendConnect ${account.email}] Checking for Achievements`
				);

			try {
				account.achievements.get(achievements => {
					if (achievements.length === 0) {
						if (this.additionalOptions.log)
							console.log(
								`[FriendConnect ${account.email}] Passed Achievement Check`
							);
						this.#accountsWithNoAchievements++;
						this.emit("achievementChecked");
					} else {
						throw new Error(
							`This account "${account.email}" has achievements, please use an alt account without achievements to protect your account.`
						);
					}
				});
			} catch (error) {
				this.errorHandling(
					error,
					account.email,
					"Checking for Achievements"
				);
			}
		}
	}
	private ip: string;
	private port: number;
	createMinecraftLobbyCustomProperties(
		xbox: XboxLiveClient,
		options: FriendConnectSessionInfoOptions
	): MinecraftLobbyCustomProperties {
		this.ip = options.ip;
		this.port = options.port;

		if (this.additionalOptions.log)
			console.log(`[FriendConnect ${xbox.email}] Creating Session Info`);
		return {
			BroadcastSetting: 3,
			CrossPlayDisabled: false,
			Joinability: options.joinability,
			LanGame: true,
			MaxMemberCount: options.maxConnectedPlayers,
			MemberCount: options.connectedPlayers,
			OnlineCrossPlatformGame: true,
			SupportedConnections: [
				{
					ConnectionType: options.connectionType,
					HostIpAddress: options.ip,
					HostPort: options.port,
					RakNetGUID: "",
				},
			],
			TitleId: 0,
			hostName: options.hostName,
			ownerId: xbox.token.userXUID,
			rakNetGUID: "",
			worldName: options.worldName,
			worldType: "Survival",
			protocol: options.protocol,
			version: options.version,
			levelId: "level",
			TransportLayer: 0,
		};
	}

	setFriendInterval(accounts: IterableIterator<XboxLiveClient>) {
		for (let account of accounts) {
			setInterval(() => {
				if (
					!this.fullOfFriends.has(account.token.userXUID) && // maybe error
					!this.doingDuplicateFriendCheck &&
					!account.isTokenRefreshing
				) {
					this.doingAutoFriendInterval = true;
					if (this.additionalOptions.log)
						console.log(
							`[FriendConnect ${account.email}] AutoFriend Interval`
						);
					let req = request(
						"https://peoplehub.xboxlive.com/users/me/people/followers",
						{
							method: "GET",
							headers: {
								Authorization: account.tokenHeader,
								"x-xbl-contract-version": 5,
								"Accept-Language": "en-us",
							},
						},
						res => {
							//console.log(res.statusCode, res.statusMessage);
							var body = "";
							res.on("data", chunk => {
								body += chunk;
							});

							res.on("end", () => {
								//it does not re do the interval
								try {
									let data: PeopleHubTypes.PeopleList =
										JSON.parse(body);
									if (this.additionalOptions.log)
										console.log(
											`[FriendConnect ${account.email}] ${data.people.length} profile(s) have this account friended.` //followed ${this.profileName}
										);
									for (let person of data.people) {
										if (person.isFollowingCaller) {
											if (
												!person.isFollowedByCaller &&
												!this.#friendXuids.has(
													person.xuid
												)
											) {
												account.social.addFriend(
													person.xuid
												);

												if (this.additionalOptions.log)
													console.log(
														`[FriendConnect ${account.email}] Added Friend ${person.gamertag}`
													);
												this.#friendXuids.add(
													person.xuid
												);
												this.emit("friendAdded", {
													account,
													person: person.xuid,
												});
											}
										}
									}
									this.doingAutoFriendInterval = false;
								} catch (error) {
									this.errorHandling(
										error,
										account.email,
										"AutoFriend Interval"
									);
									this.doingAutoFriendInterval = false;
								}
							});

							res.on("error", error => {
								this.errorHandling(
									error,
									account.email,
									"AutoFriend Interval"
								);
								this.doingAutoFriendInterval = false;
							});
						}
					);
					req.on("error", error => {
						this.errorHandling(
							error,
							account.email,
							"AutoFriend Interval"
						);
						this.doingAutoFriendInterval = false;
					});
					req.end();
				}
			}, 15000);
		}
	}
	doingAutoFriendInterval: boolean;
	async getAdvertisement(): Promise<void> {
		try {
			let info = await ping({
				host: this.ip,
				port: parseInt(`${this.port}`),
			});
			if (!this.additionalOptions.constants.gamemode)
				this.minecraftLobbyCustomOptions.worldType = info.gamemode;
			if (!this.additionalOptions.constants.worldName)
				//@ts-ignore
				this.minecraftLobbyCustomOptions.worldName = info.levelName;
			if (!this.additionalOptions.constants.hostName)
				this.minecraftLobbyCustomOptions.hostName = info.motd;
			if (!this.additionalOptions.constants.protocol)
				this.minecraftLobbyCustomOptions.protocol = info.protocol;
			if (!this.additionalOptions.constants.version)
				this.minecraftLobbyCustomOptions.version = info.version;
			if (!this.additionalOptions.constants.connectedPlayers)
				this.minecraftLobbyCustomOptions.MemberCount =
					//@ts-ignore
					parseInt(info.playersOnline);
			if (!this.additionalOptions.constants.maxConnectedPlayers)
				this.minecraftLobbyCustomOptions.MaxMemberCount =
					//@ts-ignore
					parseInt(info.playersMax);
		} catch (e) {
			this.errorHandling(e, "", "Server Advertisement");
		}
	}

	errorHandling(error: Error, email: string, source: string) {
		if (this.additionalOptions.log) {
			console.error(
				`[FriendConnect ${email}] ${source} Error`,
				"\nError Name: ",
				error.name,
				"\nError Message: ",
				error.message,
				"\nError Stack: ",
				error.stack
			);

			if (!fs.existsSync("./friend-connect-error.log")) {
				fs.writeFileSync(
					"./friend-connect-error.log",
					"If restarting does not fix your error, submit this file in an github issue. https://github.com/minerj101/FriendConnect.\n-------------------------------------------------------\n",
					"utf8"
				);
			}
			let message: string;
			message = `\n[${Date.now()}] ${source} Error:\n
		Name: ${error.name}\n
		Message: ${error.message}\n
		Stack: ${error.stack}\n
		Error: ${error}\n
		\n---------------------------------`;

			fs.appendFileSync("./friend-connect-error.log", message, "utf8");
		}
	}
}

export { Session };
