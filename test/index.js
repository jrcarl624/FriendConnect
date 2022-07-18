import { Session } from "../dist/index.js";
import { config } from "dotenv";
import pkg from "prismarine-auth";
const { Authflow, Titles } = pkg;

config();

const t = await new Authflow("tailvilemc@gmail.com", "./auth", {
	authTitle: Titles.MinecraftNintendoSwitch,
	deviceType: "Nintendo",
	password: "Pjehmy8a",
}).getXboxToken();
new Session({
	hostName: "Tailvile.xyz",
	worldName: "Fun Fact: Tailvile is almost 2 years old.",
	version: "1.19.10",
	protocol: 534,
	players: 0,
	maxPlayers: 20,
	ip: "tailvile.xyz",
	port: 19132,
	log: true,
	connectionType: 6,
	keepVersionAndProtocolConstant: true,
	autoFriending: true,
});
