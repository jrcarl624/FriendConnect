import { XboxClient } from "..";
import { GUID, UserIdentifier } from "../types";
import { Achievement } from "../xboxRestTypes";
import { parseIdentifier } from "../utils";
interface TitleHistoryQueryStringParameters {
	/**
	 * Return items beginning after the given number of items. For example, skipItems="3" will retrieve items beginning with the fourth item retrieved.
	 */
	skipItems: `${number}`;
	/**
	 * Return the items starting at the given continuation token.
	 */
	continuationToken?: string;
	/**
	 * Maximum number of items to return from the collection, which can be combined with skipItems and continuationToken to return a range of items. The service may provide a default value if maxItems is not present, and may return fewer than maxItems, even if the last page of results has not yet been returned.
	 */
	maxItems?: `${number}`;
}

export default class Achievements {
	private readonly xbox: XboxClient;
	static readonly uri: string = "https://achievements.xboxlive.com";
	constructor(xboxLiveClient: XboxClient) {
		this.xbox = xboxLiveClient;
	}
	//TODO language type
	async getAchievements(
		identifier: UserIdentifier,
		language?: string
	): Promise<Achievement[]> {
		const res = await fetch(
			`${Achievements.uri}/users/${parseIdentifier(
				identifier
			)}/achievements`,
			{
				method: "GET",
				headers: {
					Authorization: this.xbox.authorizationHeader,
					"x-xbl-contract-version": "5",
					"Accept-Language": language ?? "en-us",
				},
			}
		);

		let text = await res.status;
		let data = await res.json();
		return data.achievements;
	}
	async getAchievement(
		identifier: UserIdentifier,
		serviceConfigId: GUID,
		achievementId: number,
		language?: string
	): Promise<Achievement> {
		const res = await fetch(
			`${Achievements.uri}/users/${parseIdentifier(
				identifier
			)}/achievements/${serviceConfigId}/${achievementId}`,
			{
				method: "GET",
				headers: {
					Authorization: this.xbox.authorizationHeader,
					"x-xbl-contract-version": "5",
					"Accept-Language": language ?? "en-us",
				},
			}
		);
		let data = await res.json();
		return data.achievement;
	}
	/**
	 * Returns a 403 atm
	 */
	async getTitleHistory(
		identifier?: UserIdentifier,
		query?: TitleHistoryQueryStringParameters
	): Promise<unknown> {
		const res = await fetch(
			`${Achievements.uri}/users/${parseIdentifier(
				identifier //@ts-ignore
			)}/history/titles${new URLSearchParams(query)}`,
			{
				method: "GET",
				headers: {
					Authorization: this.xbox.authorizationHeader,
					"x-xbl-contract-version": "5",
				},
			}
		);
		let data = await res.json();
		return data;
	}
}
