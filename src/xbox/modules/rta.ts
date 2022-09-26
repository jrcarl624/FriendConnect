import EventEmitter from "events";
import crypto from "crypto";
import fs from "fs";
import { XboxClient } from "../";
import { MultiplayerSessionRequest } from "../xboxRestTypes";
import wsPkg, { ICloseEvent, IMessageEvent } from "websocket";
const { w3cwebsocket: W3CWebSocket } = wsPkg;

export class RTAMultiplayerSession extends EventEmitter {
	private readonly xbox: XboxClient;
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
	multiplayerSessionRequest: MultiplayerSessionRequest;
	members: Set<XboxClient> = new Set<XboxClient>();
	functionsToRunOnSessionUpdate: Set<() => void> = new Set();
	autoRestart: boolean;
	firstStartSignaled: boolean = false;
	private readonly updateSessionCallback: (
		rtaMultiplayerSession: RTAMultiplayerSession
	) => void;
	constructor(
		xbox: XboxClient,
		multiplayerSessionRequest: MultiplayerSessionRequest,
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
			if (this.websocketConnected && !this.xbox.token.isRefreshing)
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
			this.xbox.token.reset();
			//fs.unlinkSync(`${this.xbox.authPath}/${this.xbox.emailHash}_live-cache.json`);
			this.startTimes = 0;
			setTimeout(() => {
				this.xbox.token.refresh().then(() => {
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
				Authorization: this.xbox.authorizationHeader,
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
						xuid: this.xbox.xuid,
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

	join(xbox: XboxClient) {
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
									xuid: xbox.xuid,
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
