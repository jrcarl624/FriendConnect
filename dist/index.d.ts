/// <reference types="node" resolution-mode="require"/>
import events from "events";
interface SessionInfoOptions {
    hostName: string;
    worldName: string;
    version: string;
    protocol: number;
    players: number;
    maxPlayers: number;
    ip: string;
    port: number;
}
interface Connection {
    ConnectionType: 7;
    HostIpAddress: string;
    HostPort: number;
    RakNetGUID: string;
}
interface SessionRequestOptions {
    properties: {
        system: {
            joinRestriction: string | "followed";
            readRestriction: string | "followed";
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
            ownerId: string;
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
                    connection: string;
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
    connectionId?: string;
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
declare class Session extends events.EventEmitter {
    SessionInfo: SessionInfo;
    sessionStarted: boolean;
    token: Token;
    xblInstance: any;
    constructor(options: SessionInfoOptions, token: Token);
    createSessionInfo(options: SessionInfoOptions): SessionInfo;
    updateSessionInfo(options: SessionInfoOptions): void;
    createSessionRequest(): SessionRequestOptions;
    createHandleRequest(version: number, type: string, sessionRef: sessionRef): {
        version: number;
        type: string;
        sessionRef: sessionRef;
    };
    updateSession(sessionInfo?: SessionInfoOptions): void;
}
export { Session };
