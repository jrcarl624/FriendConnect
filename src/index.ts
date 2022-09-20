import crypto from "crypto";
import { EventEmitter } from "events";
import fs from "fs";
import https, { RequestOptions } from "https";
import {
	ping,
	createServer,
	ServerAdvertisement,
	Client,
	Server,
} from "bedrock-protocol";

import * as xboxRestTypes from "./xbox/xboxRestTypes";
import authPkg from "prismarine-auth";

const { Titles } = authPkg;
import wsPkg, { ICloseEvent, IMessageEvent } from "websocket";

import { config } from "dotenv";
import { ClientRequest, IncomingMessage } from "http";
import * as XboxRestTypes from "./xbox/xboxRestTypes";
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
import { XboxLiveClient, RTAMultiplayerSession, PeopleHubTypes } from "./xbox";
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
						i.social.addFriend(j.token.userXUID).then(async res => {
							debug(res.status);
							this.#friendXuids.add(j.token.userXUID);
							debug(await res.text());
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
							let friendsList: XboxRestTypes.PeopleList =
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
				account.achievements
					.getAchievements(parseInt(account.token.userXUID))
					.then(achievements => {
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
