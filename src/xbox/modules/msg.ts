import { XboxClient } from "..";
import { UserIdentifier } from "../types/index";
import { parseIdentifier } from "../utils/index";

export default class Message {
	private readonly xbox: XboxClient;
	static readonly uri: string = "https://msg.xboxlive.com";
	constructor(xbox: XboxClient) {
		this.xbox = xbox;
	}
	/**
	 * Retrieves a specified number of user message summaries from the service.
	 */
	async getMessageSummaries(identifier: UserIdentifier, messageId: string) {
		const res = fetch(
			`${Message.uri}/users/${parseIdentifier(identifier)}/inbox`
		).then();
	}
}
