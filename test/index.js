import { Session } from "../dist/index.js";
import pkg from "prismarine-auth";
const { Authflow, Titles } = pkg;
const token = await new Authflow("TailvileMC", "./auth", {
	authTitle: Titles.MinecraftNintendoSwitch,
	deviceType: "Nintendo",
}).getXboxToken();

new Session(
	{
		hostName: "Tailvile.xyz",
		worldName: "Fun Fact: Tailvile is almost 2 years old.",
		version: "1.19.2",
		protocol: 527,
		players: 0,
		maxPlayers: 20,
		ip: "tailvile.xyz",
		port: 19132,
	},
	token
);
