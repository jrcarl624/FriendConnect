import { XboxClient } from "../index";
import { UserIdentifier } from "../types";
import { parseIdentifier } from "../utils/index";
import { Person, PersonSummary, PeopleList } from "../xboxRestTypes";

export default class Social {
	private readonly xbox: XboxClient;
	static readonly uri: string = "https://social.xboxlive.com";
	constructor(xboxLiveClient: XboxClient) {
		this.xbox = xboxLiveClient;
	}
	async getFriends(): Promise<PeopleList> {
		const res = await fetch(`${Social.uri}/users/me/people`, {
			method: "GET",
			headers: {
				Authorization: this.xbox.authorizationHeader,
			},
		});
		return await res.json();
	}
	addFriend(identifier: UserIdentifier) {
		return fetch(
			`${Social.uri}/users/me/people/${parseIdentifier(identifier)}`,
			{
				method: "PUT",
				headers: {
					Authorization: this.xbox.authorizationHeader,
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
					Authorization: this.xbox.authorizationHeader,
				},
			}
		);
	}
	async getProfile(identifier: UserIdentifier): Promise<Person> {
		const res = await fetch(
			`${Social.uri}/users/me/people/${parseIdentifier(identifier)}`,
			{
				method: "GET",
				headers: {
					Authorization: this.xbox.authorizationHeader,
				},
			}
		);
		return await res.json();
	}
	async getProfileSummary(
		identifier: UserIdentifier
	): Promise<PersonSummary> {
		const res = await fetch(
			`${Social.uri}/users/${parseIdentifier(identifier)}/summary`,
			{
				method: "GET",
				headers: {
					Authorization: this.xbox.authorizationHeader,
				},
			}
		);
		let data = await res.json();
		return data;
	}
}
