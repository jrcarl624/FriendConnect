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

import { XboxClient } from "../";
import { UserIdentifier } from "../types";
import { parseIdentifier } from "../utils/index.js";
export default class PeopleHub {
	private readonly xbox: XboxClient;
	static readonly uri: string = "https://peoplehub.xboxlive.com";
	constructor(xboxLiveClient: XboxClient) {
		this.xbox = xboxLiveClient;
	}
	async getFollowers(identifier?: UserIdentifier): Promise<PeopleList> {
		const res = await fetch(
			`${PeopleHub.uri}/users/${parseIdentifier(
				identifier
			)}/people/followers`,
			{
				method: "GET",
				headers: {
					Authorization: this.xbox.authorizationHeader,
					"x-xbl-contract-version": "5",
					"Accept-Language": "en-us",
				},
			}
		);
		let data = await res.json();
		return data;
	}
	async getPeople(xuids: string[]): Promise<PeopleList> {
		const res = await fetch(
			`${PeopleHub.uri}/users/me/people/batch/decoration/`,
			{
				method: "POST",
				headers: {
					Authorization: this.xbox.authorizationHeader,
					"x-xbl-contract-version": "5",
					"Accept-Language": "en-us",
				},
				body: JSON.stringify({
					xuids,
				}),
			}
		);
		let data = await res.json();
		return data;
	}
}
