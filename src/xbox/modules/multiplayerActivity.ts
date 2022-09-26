import { XboxClient } from "..";

export default class MultiplayerActivity {
	readonly xbox: XboxClient;
	static readonly uri = "multiplayeractivity.xboxlive.com";
	constructor(xbox: XboxClient) {
		this.xbox = xbox;
	}

	/**
	 * Sets or updates the activity for a user playing a specific title. This API allows a game client or server to set/update the multiplayer activity for a user playing a particular title. The activity must be set as soon as the user is active in a multiplayer activity. Xbox Live users will be able to subscribe to changes in activity for other users (generally friends) and these updates will be pushed to the Xbox clients via RTA.
	 *  @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/uri/multiplayeractivity/swagger-uris/uri-updateactivity
	 */
	setActivity(titleId: string, xuid: string) {
		return fetch(``, {
			headers: {
				Authorization: this.xbox.authorizationHeader,
				"Content-Type": "string",
			},
		});
	}
	getActivity(titleId: string, xuid: string) {
		return fetch(``, {
			headers: {
				Authorization: this.xbox.authorizationHeader,
				//"Content-Type": "application/text",
			},
		});
	}

	deleteActivity(titleId: string, xuid: string) {
		return fetch(``, {
			headers: {
				Authorization: this.xbox.authorizationHeader,
				//"Content-Type": "string",
			},
		});
	}
}
