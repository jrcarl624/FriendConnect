import crypto from "crypto";
import events from "events";
import fs from "fs";
import https from "https";
import uniRest from "unirest";

import { ping, ServerAdvertisement } from "bedrock-protocol";

import authPkg from "prismarine-auth";
const { Authflow, Titles } = authPkg;

import wsPkg from "websocket";
const { w3cwebsocket: W3CWebSocket } = wsPkg;

const Constants = {
	SERVICE_CONFIG_ID: "4fc10100-5f7a-4470-899b-280835760c07", // The service config ID for Minecraft
	PEOPLE: "https://social.xboxlive.com/users/me/people",
	PEOPLE_HUB: "https://peoplehub.xboxlive.com/users/me/people",
	HANDLE: "https://sessiondirectory.xboxlive.com/handles",
	CONNECTIONS: "https://sessiondirectory.xboxlive.com/connections",
	RTA_SOCKET: "wss://rta.xboxlive.com/socket",
	LIVE_TOKEN_REQUEST: "https://login.live.com/oauth20_token.srf",
	AUTH_TITLE: "00000000441cc96b", // Nintendo Switch Title ID
	DEBUG: false,
};

const debug = (...args) => {
	if (Constants.DEBUG) {
		console.log(...args);
	}
};

interface SessionInfoOptions {
	tokenPath: fs.PathLike;
	keepVersionAndProtocolConstant: boolean;
	hostName: string;
	worldName: string;
	version: string;
	protocol: number;
	players: number;
	maxPlayers: number;
	ip: string;
	port: number;
	log?: boolean;
	connectionType: number;
	autoFriending: boolean;
	email: string;
}

interface Connection {
	ConnectionType: number;
	HostIpAddress: string;
	HostPort: number;
	RakNetGUID: string;
}

interface SessionRequestOptions {
	properties: {
		system: {
			joinRestriction: "followed";
			readRestriction: "followed";
			closed: false;
		};
		custom: {
			BroadcastSetting: 3;
			CrossPlayDisabled: false;
			Joinability: string | "joinable_by_friends";
			LanGame: true;
			MaxMemberCount: number;
			MemberCount: number;
			OnlineCrossPlatformGame: true;
			SupportedConnections: Connection[];
			TitleId: 0;
			TransportLayer: 0;
			levelId: "level";
			hostName: string;
			ownerId: string; //xuid
			rakNetGUID: string;
			worldName: string;
			worldType: "Survival";
			protocol: number;
			version: string;
		};
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

interface SessionInfo {
	keepVersionAndProtocolConstant: boolean;
	hostName: string;
	worldName: string;
	version: string;
	protocol: number;
	players: number;
	maxPlayers: number;
	ip: string;
	port: number;
	rakNetGUID: string;
	sessionId: string;
	xuid: string;
	connectionId: string;
	connectionType: number;
	autoFriending: boolean;
	log: boolean;
}

interface Token {
	userXUID: string;
	userHash: string;
	XSTSToken: string;
	expiresOn: number;
}

interface sessionRef {
	scid: string;
	templateName: string;
	name: string;
}

interface CreateHandleRequest {
	version: number;
	type: string;
	sessionRef: sessionRef;
}

interface People {
	xuid: string;
	addedDateTimeUtc: string;
	isFavorite: boolean;
	isKnown: boolean;
	socialNetworks: string[];
	isFollowedByCaller: boolean;
	isFollowingCaller: boolean;
	isUnfollowingFeed: boolean;
}

interface PeopleList {
	totalCount: number;
	people: People[];
}

class XboxLive {
	token: Token;

	get tokenHeader(): string {
		return `XBL3.0 x=${this.token.userHash};${this.token.XSTSToken}`;
	}
	constructor(token: Token) {
		this.token = token;
	} //TODO: Add Error handling to each

	addFriend(xuid: string) {
		https
			.request(
				Constants.PEOPLE + `/xuid(${xuid})`,
				{
					method: "PUT",
					headers: {
						Authorization: this.tokenHeader,
					},
				},
				(res) => {
					//console.log(res.statusCode, res.statusMessage);
					res.on("error", (err) => {
						console.log("Add Friend:\n", err);
					});
				}
			)
			.end();
	}
	removeFriend(xuid: string) {
		//TODO: fix this
		https
			.request(
				Constants.PEOPLE + `/xuid(${xuid})`,
				{
					method: "DELETE",
					headers: {
						Authorization: this.tokenHeader,
					},
				},
				(res) => {
					res.on("error", (err) => {
						console.log("Remove Friend:\n", err);
					});
				}
			)
			.end();
	}

	async getProfile(xuid: string) {
		https
			.request(
				Constants.PEOPLE + `/xuid(${xuid})`,
				{
					method: "GET",
					headers: {
						Authorization: this.tokenHeader,
					},
				},
				(res) => {
					//console.log(res.statusCode, res.statusMessage);
					res.on("error", (err) => {
						console.log("Get Profile:\n", err);
					});
				}
			)
			.end();
	}
}

//console.log(new XboxLive(token).tokenHeader);

//TODO updating player number and motd

class Session extends events.EventEmitter {
	SessionInfo: SessionInfo;
	sessionStarted: boolean = false;
	token: Token;
	xblInstance: XboxLive;

	log: boolean = false;

	stopped = false;
	profileName: any;

	refreshTime: number;

	constructor(options: SessionInfoOptions) {
		super();

		if (!options.email) throw new Error("Email is required");

		if (!options.connectionType)
			throw new Error("Connection Type is required");

		if (!options.ip) throw new Error("IP is required");

		if (!options.port) throw new Error("Port is required");

		if (!options.tokenPath) throw new Error("Token Path is required");

		if (!options.hostName)
			options.hostName = "Edit, Hostname to change this";

		if (!options.worldName)
			options.worldName = "Edit, World Name to change this";

		if (options.log) this.log = true;

		this.refreshXblToken(options.email, options.tokenPath);

		this.on("tokenRefreshed", () => {
			console.log("[FriendConnect] Connecting to RTA Websocket");
			this.SessionInfo = this.createSessionInfo(options);
			var ws = new W3CWebSocket(
				"wss://rta.xboxlive.com/connect",
				"echo-protocol",
				undefined,
				{
					Authorization: `XBL3.0 x=${this.token.userHash};${this.token.XSTSToken}`,
				}
			);
			let liveCache = JSON.parse(fs.readdirSync(options.tokenPath)[0]);
			this.refreshTime =
				liveCache.token.expires_in + liveCache.obtainedOn;

			ws.onerror = (error) => {
				console.error("[FriendConnect] RTA Websocket Connection Error");
				console.error("Error Name: ", error.name);
				console.error("Error Message: ", error.message);
				console.error("Error Stack: ", error.stack);
				this.messageLogger(error, undefined, "RTA Websocket");
				this.stopped = true;

				new Session(options);
			};

			ws.onopen = () => {
				ws.send(
					'[1,1,"https://sessiondirectory.xboxlive.com/connections/"]'
				);
				if (this.log)
					console.log(
						"[FriendConnect] WebSocket Client Connected to RTA"
					);
			};
			ws.onclose = (event) => {
				if (this.log) {
					console.log("[FriendConnect] WebSocket Client Closed");
					console.log("Code: " + event.code);
					console.log("Reason: " + event.reason);
					console.log("Clean Exit: " + event.wasClean);
				}

				if (this.log) console.log("[FriendConnect] Restarting...");
				this.stopped = true;

				new Session(options);
			};

			ws.onmessage = (event) => {
				//if (this.log) console.log(event.data);
				switch (typeof event.data) {
					case "string":
						const data = JSON.parse(event.data);

						if (event.data.includes("ConnectionId")) {
							this.SessionInfo.connectionId =
								data[4].ConnectionId;
							this.emit("connectionId");
						} else if (this.log) {
							try {
								console.log(
									"----------------------------------- Start of RTA Websocket Message\n",
									JSON.parse(event.data.toString()),
									"\n----------------------------------- End of RTA Websocket Message"
								);
							} catch {
								console.log(
									"----------------------------------- Start of RTA Websocket Message\n",
									event.data.toString(),
									"\n----------------------------------- End of RTA Websocket Message"
								);
							}
						}
				}
			};

			this.on("connectionId", () => {
				//console.log(this.SessionInfo.connectionId);
				this.updateSession();
			});
			this.on("sessionUpdated", () => {
				if (!this.sessionStarted) {
					var createHandleRequestOptions = {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: this.xblInstance.tokenHeader,
							"x-xbl-contract-version": 107,
						},
					};

					var createHandleContent = this.createHandleRequest(
						1,
						"activity",
						{
							scid: Constants.SERVICE_CONFIG_ID,
							templateName: "MinecraftLobby",
							name: this.SessionInfo.sessionId,
						}
					);

					var createHandleRequest = https.request(
						Constants.HANDLE,
						createHandleRequestOptions,
						(res) => {
							//console.log("statusCode:", res.statusCode);
							//console.log("headers:", res.headers);
							res.on("data", (data) => {
								if (this.log)
									console.log(
										"----------------------------------- Start of Handle Request\n",
										JSON.parse(data.toString()),
										"\n----------------------------------- End of Handle Request"
									);
							});
						}
					);

					createHandleRequest.write(
						JSON.stringify(createHandleContent)
					);

					createHandleRequest.on("error", (error) => {
						this.messageLogger(
							error,
							undefined,
							"createHandleRequest"
						);
					});
					createHandleRequest.end();
					this.sessionStarted = true;
					this.emit("sessionStarted");
				}
			});

			this.on("sessionStarted", () => {
				if (this.log) console.log("[FriendConnect] Session started");

				setInterval(() => {
					if (!this.stopped) this.updateSession(this.SessionInfo);
				}, 30000);

				setInterval(() => {
					if (Date.now() + 1800000 >= this.refreshTime) {
						this.refreshXblToken(options.email, options.tokenPath);
					}
				}, 60000 * 60);

				if (options.autoFriending)
					setInterval(() => {
						if (!this.stopped) {
							if (this.log)
								console.log(
									"[FriendConnect] AutoFriend Interval"
								);
							let request = https.request(
								Constants.PEOPLE_HUB + "/followers",
								{
									method: "GET",
									headers: {
										Authorization:
											this.xblInstance.tokenHeader,
										"x-xbl-contract-version": 5,
										"Accept-Language": "en-us",
									},
								},
								(res) => {
									//console.log(res.statusCode, res.statusMessage);
									var body = "";
									res.on("data", function (chunk) {
										body += chunk;
									});

									res.on("end", () => {
										try {
											let data: PeopleList =
												JSON.parse(body);
											if (this.log)
												console.log(
													`[FriendConnect] ${data.people.length} profile(s) have the host profile friended.` //followed ${this.profileName}
												);
											for (let i of data.people) {
												if (i.isFollowingCaller) {
													if (!i.isFollowedByCaller)
														this.xblInstance.addFriend(
															i.xuid
														);
												} else {
													this.xblInstance.removeFriend(
														i.xuid
													);
												}
											}
										} catch (error) {
											console.error(
												"[FriendConnect] AutoFriend Interval Error"
											);
											console.error(
												"Error Name: ",
												error.name
											);
											console.error(
												"Error Message: ",
												error.message
											);
											console.error(
												"Error Stack: ",
												error.stack
											);
											this.messageLogger(
												error,
												undefined,
												"AutoFriend Interval"
											);
										}
									});

									res.on("error", (error) => {
										console.error(
											"[FriendConnect] AutoFriend Interval Error"
										);
										console.error(
											"Error Name: ",
											error.name
										);
										console.error(
											"Error Message: ",
											error.message
										);
										console.error(
											"Error Stack: ",
											error.stack
										);
										this.messageLogger(
											error,
											undefined,
											"AutoFriend Interval"
										);
									});
								}
							);
							request.on("error", (error) => {
								console.error(
									"[FriendConnect] AutoFriend Interval Error"
								);
								console.error("Error Name: ", error.name);
								console.error("Error Message: ", error.message);
								console.error("Error Stack: ", error.stack);
								this.messageLogger(
									error,
									undefined,
									"AutoFriend Interval"
								);
							});
							request.end();
						}
					}, 10000);
			});
		});
	}

	async refreshXblToken(email: string, tokenPath: fs.PathLike) {
		try {
			let authDir = fs.readdirSync(tokenPath);

			if (authDir.length > 2) {
				throw new Error(
					"You may only have one account in your auth directory."
				);
			}
			let liveCache = JSON.parse(
				fs.readFileSync(`${tokenPath}${authDir[0]}`, "utf8")
			);

			const req = uniRest("POST", Constants.LIVE_TOKEN_REQUEST);

			req.headers({
				"Content-Type": "application/x-www-form-urlencoded",
			});

			req.form({
				scope: liveCache.token.scope,
				client_id: Constants.AUTH_TITLE,
				grant_type: "refresh_token",
				refresh_token: liveCache.token.refresh_token,
			});
			req.end((res) => {
				fs.writeFileSync(
					`${tokenPath}${authDir[0]}`,
					JSON.stringify({ token: res.body }),
					"utf8"
				);
				try {
					fs.unlinkSync(`${tokenPath}${authDir[1]}`);
				} catch {}

				this.getXblTokenAndCheckAchievements(email, tokenPath);
			});
		} catch {
			this.getXblTokenAndCheckAchievements(email, tokenPath);
		}
	}

	async getXblTokenAndCheckAchievements(
		email: string,
		tokenPath: fs.PathLike
	) {
		if (this.log) console.log("[FriendConnect] Getting XboxLive Token");
		//@ts-ignore
		new Authflow(email, tokenPath, {
			authTitle: Titles.MinecraftNintendoSwitch,
			deviceType: "Nintendo",
		})
			.getXboxToken()
			.then((token) => {
				this.xblInstance = new XboxLive(token);
				this.token = token;

				const req = https.request(
					`https://achievements.xboxlive.com/users/xuid(${this.xblInstance.token.userXUID})/achievements`,
					{
						method: "GET",
						headers: {
							Authorization: this.xblInstance.tokenHeader,
							"x-xbl-contract-version": "5",
							"Content-Length": "7",
						},
					},
					(res) => {
						const chunks = [];

						res.on("data", function (chunk) {
							chunks.push(chunk);
						});

						res.on("end", () => {
							if (this.log)
								console.log(
									"[FriendConnect] Checking for Achievements"
								);
							const body = Buffer.concat(chunks).toString();
							const data = JSON.parse(body);
							debug(data);
							if (data.achievements.length === 0) {
								if (!this.sessionStarted) {
									this.emit("tokenRefreshed", token);
								} else {
									this.token = token;
								}
							} else {
								throw new Error(
									"This account has achievements, please use an alt account without achievements to protect your account."
								);
							}
						});
					}
				);
				req.end();
				req.on("error", (err) => {
					debug(err);
				});
			});
	}

	createSessionInfo(options: SessionInfoOptions): SessionInfo {
		if (this.log) console.log("[FriendConnect] Creating Session Info");
		return {
			hostName: options.hostName,
			worldName: options.worldName,
			version: options.version,
			protocol: options.protocol,
			players: options.players,
			maxPlayers: options.maxPlayers,
			ip: options.ip,
			port: options.port,
			rakNetGUID: "",
			sessionId: crypto.randomUUID(),
			xuid: this.token.userXUID,
			connectionId: "",
			connectionType: options.connectionType,
			keepVersionAndProtocolConstant:
				options.keepVersionAndProtocolConstant,
			autoFriending: options.autoFriending,
			log: this.log,
		};
	}

	messageLogger(
		error: Error,
		wsClose: wsPkg.ICloseEvent,
		source: string
	): void {
		if (this.log) {
			if (!fs.existsSync("./error.log")) {
				fs.writeFileSync(
					"./friend-connect.log",
					"If restarting does not fix your error, submit this file in an github issue. https://github.com/minerj101/FriendConnect.\n-------------------------------------------------------\n",
					"utf8"
				);
			}

			let message: string;
			if (wsClose)
				message = `\n[${Date.toString()}] Websocket Close:\n
		Code: ${wsClose.code}\n
		Reason: ${wsClose.reason}\n
		WasClean: ${wsClose.wasClean}\n
		\n---------------------------------`;

			if (error)
				message = `\n[${Date.toString()}] ${source} Error:\n
		Name: ${error.name}\n
		Message: ${error.message}\n
		Stack: ${error.stack}\n
		\n---------------------------------`;

			fs.appendFileSync("./friend-connect.log", message, "utf8");
		}
	}

	updateSessionInfo(options: SessionInfo) {
		for (const key in options) {
			this.SessionInfo[key] = options[key];
		}
	}

	async getAdvertisement(): Promise<ServerAdvertisement> {
		let info;
		try {
			info = await ping({
				host: this.SessionInfo.ip,
				port: this.SessionInfo.port,
			});
		} catch (e) {
			info = {
				motd: this.SessionInfo.worldName,
				name: this.SessionInfo.hostName,
				protocol: this.SessionInfo.protocol,
				version: this.SessionInfo.version,
				playersOnline: this.SessionInfo.players,
				playersMax: this.SessionInfo.maxPlayers,
				gamemode: "survival",
				serverId: "",
			};
		}

		if (this.SessionInfo.keepVersionAndProtocolConstant) {
			info.version = this.SessionInfo.version;
			info.protocol = this.SessionInfo.protocol;
		}
		return info;
	}

	async createSessionRequest(): Promise<SessionRequestOptions> {
		//TODO: delete this
		console.log("[FriendConnect] Creating Session Request");

		const info = await this.getAdvertisement();

		return {
			properties: {
				system: {
					joinRestriction: "followed",
					readRestriction: "followed",
					closed: false,
				},
				custom: {
					BroadcastSetting: 3,
					CrossPlayDisabled: false,
					Joinability: "joinable_by_friends",
					LanGame: true,
					MaxMemberCount:
						parseInt(info.playersMax.toString()) ||
						this.SessionInfo.maxPlayers,
					MemberCount:
						parseInt(info.playersOnline.toString()) ||
						this.SessionInfo.players,
					OnlineCrossPlatformGame: true,
					SupportedConnections: [
						{
							ConnectionType: this.SessionInfo.connectionType,
							HostIpAddress: this.SessionInfo.ip,
							HostPort: this.SessionInfo.port,

							RakNetGUID: "",
						},
					],
					TitleId: 0,
					hostName: this.SessionInfo.hostName,
					ownerId: this.SessionInfo.xuid,
					rakNetGUID: "",
					worldName: this.SessionInfo.worldName,
					worldType: "Survival",
					protocol: this.SessionInfo.protocol,
					version: this.SessionInfo.version,
					levelId: "level",
					TransportLayer: 0,
				},
			},
			members: {
				me: {
					constants: {
						system: {
							xuid: this.SessionInfo.xuid,
							initialize: true,
						},
					},
					properties: {
						system: {
							active: true,
							connection: this.SessionInfo.connectionId,
							subscription: {
								id: "845CC784-7348-4A27-BCDE-C083579DD113",
								changeTypes: ["everything"],
							},
						},
					},
				},
			},
		};
	}

	createHandleRequest(version: number, type: string, sessionRef: sessionRef) {
		return {
			version: version,
			type: type,
			sessionRef: sessionRef,
		};
	}

	async updateSession(sessionInfo?: SessionInfo) {
		if (sessionInfo) {
			this.getAdvertisement().then((advertisement) => {
				sessionInfo.worldName =
					advertisement.name || sessionInfo.worldName;
				sessionInfo.players =
					parseInt(advertisement.playersOnline.toString()) ||
					sessionInfo.players;
				(sessionInfo.maxPlayers =
					parseInt(advertisement.playersMax.toString()) ||
					sessionInfo.maxPlayers),
					(sessionInfo.version = advertisement.version);
				sessionInfo.protocol = advertisement.protocol;

				if (this.log)
					console.log(
						"----------------------------------- Start of Server Advertisement\n",
						JSON.parse(
							JSON.stringify(advertisement).replace(
								"ServerAdvertisement",
								""
							)
						),
						"\n----------------------------------- End of Server Advertisement"
					);

				this.updateSessionInfo(sessionInfo);
				if (this.log)
					console.log(
						"----------------------------------- Start of Session Info\n",
						this.SessionInfo,
						"\n----------------------------------- End of Session Info"
					);
			});
		}

		//if (sessionInfo && sessionInfo.log) console.log("updateSession");

		var createSessionContent = await this.createSessionRequest();
		//console.log(createSessionContent);
		const options = {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: this.xblInstance.tokenHeader,
				"x-xbl-contract-version": 107,
			},
		};

		//console.log(options);
		let uri =
			"https://sessiondirectory.xboxlive.com/serviceconfigs/" +
			Constants.SERVICE_CONFIG_ID +
			"/sessionTemplates/MinecraftLobby/sessions/" +
			this.SessionInfo.sessionId;

		const createSessionRequest = https.request(uri, options, (res) => {
			//console.log("statusCode:", res.statusCode);
			//console.log("headers:", res.headers);

			res.on("data", (d) => {
				if (sessionInfo && sessionInfo.log)
					console.log(
						"----------------------------------- Start of Update Session\n",
						JSON.parse(d.toString()),
						"\n----------------------------------- End of Update Session"
					);
				this.emit("sessionUpdated");
			});

			res.on("error", (err) => {
				console.error(
					"----------------------------------- Start of Update Session Error\n",
					err,
					"\n----------------------------------- End of Update Session Error"
				);
				this.messageLogger(err, undefined, "Update Session");
			});
		});
		createSessionRequest.write(JSON.stringify(createSessionContent));

		createSessionRequest.on("error", (error) => {
			console.error(
				"----------------------------------- Start of createSessionRequest Error\n",
				error,
				"\n----------------------------------- End of createSessionRequest Error"
			);
			this.messageLogger(error, undefined, "createSessionRequest");
		});
		createSessionRequest.end();
	}
}
export { Session };
