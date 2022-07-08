import wspkg from "websocket";
const { w3cwebsocket: W3CWebSocket } = wspkg;
import events from "events";
import https from "https";
import crypto from "crypto";
class Constants {
}
Constants.SERVICE_CONFIG_ID = "4fc10100-5f7a-4470-899b-280835760c07"; // The service config ID for Minecraft
Constants.PEOPLE = new URL("https://social.xboxlive.com/users/me/people");
Constants.PEOPLEHUB = new URL("https://peoplehub.xboxlive.com/users/me/people");
const debug = false;
const XboxLive = class {
    constructor(token) {
        this.token = token;
    } //TODO: Add Error handling to each
    get tokenHeader() {
        return `XBL3.0 x=${this.token.userHash};${this.token.XSTSToken}`;
    }
    addFriend(xuid) {
        let options = {
            method: "PUT",
            headers: {
                Authorization: this.tokenHeader,
            },
        };
        https
            .request(Constants.PEOPLE + `/xuid(${xuid})`, options, (res) => {
            //m       console.log(res.statusCode, res.statusMessage);
            res.on("error", (err) => {
                console.log("Add Friend:\n", err);
            });
        })
            .end();
    }
    removeFriend(xuid) {
        let options = {
            method: "DELETE",
            headers: {
                Authorization: this.tokenHeader,
            },
        };
        https
            .request(Constants.PEOPLE + `/xuid(${xuid})`, options, (res) => {
            res.on("error", (err) => {
                console.log("Remove Friend:\n", err);
            });
        })
            .end();
    }
};
//console.log(new XboxLive(token).tokenHeader);
//TODO updating player number and motd
class Session extends events.EventEmitter {
    constructor(options, token) {
        super();
        this.sessionStarted = false;
        console.log("Connecting...");
        this.token = token;
        this.SessionInfo = this.createSessionInfo(options);
        this.xblInstance = new XboxLive(token);
        var ws = new W3CWebSocket("wss://rta.xboxlive.com/connect", "echo-protocol", undefined, {
            Authorization: `XBL3.0 x=${this.token.userHash};${this.token.XSTSToken}`,
        });
        ws.onerror = (error) => {
            console.log("Error: ", error);
            console.log("Connection Error");
            console.log("Restarting...");
            new Session(options, token);
        };
        ws.onopen = () => {
            console.log("Connected");
            ws.send('[1,1,"https://sessiondirectory.xboxlive.com/connections/"]');
            console.log("WebSocket Client Connected");
        };
        ws.onclose = () => {
            console.log("WebSocket Client Closed");
            console.log("Restarting...");
            new Session(options, token);
        };
        ws.onmessage = (event) => {
            //console.log(event.data);
            switch (typeof event.data) {
                case "string":
                    const data = JSON.parse(event.data);
                    if (event.data.includes("ConnectionId")) {
                        this.SessionInfo.connectionId = data[4].ConnectionId;
                        this.emit("connectionId");
                    }
                    else {
                        console.log("----------------------------------- Start of RTA WS Message\n", event.data, "\n----------------------------------- End of RTA WS Message");
                    }
            }
        };
        this.on("connectionId", () => {
            console.log(this.SessionInfo.connectionId);
            this.updateSession();
        });
        this.on("sessionUpdated", () => {
            if (!this.sessionStarted) {
                console.log("----------------------------------- Start of Handle Request");
                var createHandleRequestOptions = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `XBL3.0 x=${this.token.userHash};${this.token.XSTSToken}`,
                        "x-xbl-contract-version": 107,
                    },
                };
                var createHandleContent = this.createHandleRequest(1, "activity", {
                    scid: Constants.SERVICE_CONFIG_ID,
                    templateName: "MinecraftLobby",
                    name: this.SessionInfo.sessionId,
                });
                var createHandleRequest = https.request("https://sessiondirectory.xboxlive.com/handles", createHandleRequestOptions, (res) => {
                    //console.log("statusCode:", res.statusCode);
                    //console.log("headers:", res.headers);
                    res.on("data", (data) => {
                        //console.log(data,"\n----------------------------------- End of Handle Request");
                    });
                });
                createHandleRequest.write(JSON.stringify(createHandleContent));
                createHandleRequest.on("error", (e) => {
                    //console.error(e);
                    //console.log("----------------------------------- End of Handle Request");
                });
                createHandleRequest.end();
                this.sessionStarted = true;
                this.emit("sessionStarted");
            }
        });
        this.on("sessionStarted", () => {
            console.log("Session started");
            setInterval(() => {
                this.updateSession(this.SessionInfo);
            }, 30000);
            setInterval(() => {
                //console.log("Friend Interval");
                let request = https.request(Constants.PEOPLEHUB + "/followers", {
                    method: "GET",
                    headers: {
                        Authorization: this.xblInstance.tokenHeader,
                        "x-xbl-contract-version": 5,
                        "Accept-Language": "en-us",
                    },
                }, (res) => {
                    //console.log(res.statusCode, res.statusMessage);
                    var body = "";
                    res.on("data", function (chunk) {
                        body += chunk;
                    });
                    res.on("end", (unparsedData) => {
                        try {
                            const data = JSON.parse(body);
                            for (let i of data.people) {
                                if (i.isFollowingCaller) {
                                    if (!i.isFollowedByCaller)
                                        this.xblInstance.addFriend(i.xuid);
                                }
                                else {
                                    this.xblInstance.removeFriend(i.xuid);
                                }
                            }
                        }
                        catch (e) {
                            console.log(e);
                        }
                    });
                    res.on("error", (err) => {
                        console.log("Get People:\n", err);
                    });
                });
                request.on("error", (err) => {
                    //console.log("Get People:\n", err);
                });
                request.end();
            }, 10000);
        });
    }
    createSessionInfo(options) {
        console.log("Creating Session Info");
        return {
            hostName: options.hostName,
            worldName: options.worldName,
            version: options.version,
            protocol: options.protocol,
            players: options.players,
            maxPlayers: options.maxPlayers,
            ip: options.ip,
            port: options.port,
            rakNetGUID: crypto.randomUUID(),
            sessionId: crypto.randomUUID(),
            xuid: this.token.userXUID,
        };
    }
    updateSessionInfo(options) {
        for (const key in options) {
            this.SessionInfo[key] = options[key];
        }
    }
    createSessionRequest() {
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
                    MaxMemberCount: this.SessionInfo.maxPlayers,
                    MemberCount: this.SessionInfo.players,
                    OnlineCrossPlatformGame: true,
                    SupportedConnections: [
                        {
                            ConnectionType: 7,
                            HostIpAddress: this.SessionInfo.ip,
                            HostPort: this.SessionInfo.port,
                            RakNetGUID: this.SessionInfo.rakNetGUID,
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
    createHandleRequest(version, type, sessionRef) {
        return {
            version: version,
            type: type,
            sessionRef: sessionRef,
        };
    }
    updateSession(sessionInfo) {
        if (sessionInfo)
            this.updateSessionInfo(sessionInfo);
        console.log("updateSession");
        var createSessionContent = this.createSessionRequest();
        console.log(createSessionContent);
        const options = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `XBL3.0 x=${this.token.userHash};${this.token.XSTSToken}`,
                "x-xbl-contract-version": 107,
            },
        };
        //console.log(options);
        let uri = "https://sessiondirectory.xboxlive.com/serviceconfigs/" +
            Constants.SERVICE_CONFIG_ID +
            "/sessionTemplates/MinecraftLobby/sessions/" +
            this.SessionInfo.sessionId;
        const createSessionRequest = https.request(uri, options, (res) => {
            //console.log("----------------------------------- Start of Update Session");
            //console.log("statusCode:", res.statusCode);
            //console.log("headers:", res.headers);
            res.on("data", (d) => {
                console.log("data:", d);
                console.log("----------------------------------- End of Update Session");
                this.emit("sessionUpdated");
            });
            res.on("error", (err) => {
                console.error(err);
                console.log("----------------------------------- End of Update Session");
            });
        });
        createSessionRequest.write(JSON.stringify(createSessionContent));
        createSessionRequest.on("error", (e) => {
            console.error(e);
        });
        createSessionRequest.end();
    }
}
export { Session };
