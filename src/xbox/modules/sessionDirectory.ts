import { XboxClient } from "..";
import { GUID } from "../types";
import {
	InviteAttributes,
	MultiplayerSessionReference,
	MultiplayerSessionRequest,
} from "../xboxRestTypes";

export interface HandleQueryResult {
	id: GUID;
	type: string;
	version: number;
	sessionRef: MultiplayerSessionReference;
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

export default class SessionDirectory {
	private readonly xbox: XboxClient;
	static readonly uri: string = "https://sessiondirectory.xboxlive.com";
	constructor(xboxLiveClient: XboxClient) {
		this.xbox = xboxLiveClient;
	}
	/**
	 * Creates queries for session handles that include related session information.
	 */
	async queryHandles(
		xuid: string,
		moniker: string,
		serviceConfigId?: string,
		includeRelatedInfo?: boolean
	): Promise<HandleQueryResult[]> {
		const res = await fetch(
			`${SessionDirectory.uri}/handles/query${
				includeRelatedInfo ? "?include=relatedInfo" : ""
			}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.xbox.authorizationHeader,
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
		let data: HandleQueryResponse = res.json();
		return data.results;
	}
	setActivity(sessionReference: MultiplayerSessionReference) {
		return fetch(`${SessionDirectory.uri}/handles`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: this.xbox.authorizationHeader,
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
		sessionReference: MultiplayerSessionReference,
		inviteAttributes: InviteAttributes
	) {
		return fetch(`${SessionDirectory.uri}/handles`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: this.xbox.authorizationHeader,
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
		multiplayerSessionRequest: MultiplayerSessionRequest,
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
					Authorization: this.xbox.authorizationHeader,
					"x-xbl-contract-version": "107",
				},
				body: JSON.stringify(multiplayerSessionRequest),
			}
		);
	}

	getSession(serviceConfigId: string, queries: SessionQueries) {
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
					Authorization: this.xbox.authorizationHeader,
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
					Authorization: this.xbox.authorizationHeader,
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
					Authorization: this.xbox.authorizationHeader,
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
					Authorization: this.xbox.authorizationHeader,
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
					Authorization: this.xbox.authorizationHeader,
					"x-xbl-contract-version": "107",
				},
			}
		);
	}

	batchQuery(
		serviceConfigId: string,
		xuids: string[],
		queries: SessionQueries
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
					Authorization: this.xbox.authorizationHeader,
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
				Authorization: this.xbox.authorizationHeader,
				"x-xbl-contract-version": "107",
			},
		});
	}
	getHandle(handleId: string) {
		return fetch(`${SessionDirectory.uri}/handles/${handleId}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: this.xbox.authorizationHeader,
				"x-xbl-contract-version": "107",
			},
		});
	}
}
