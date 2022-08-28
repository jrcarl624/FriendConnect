import { Session } from "./index.js";
import { config } from "dotenv";
config();

config();

let accounts = ["tailvilemcbe@gmail.com", "tailvilemc@gmail.com"];
import fs from "fs";

new Session({
	hostName: "FriendConnect Testing Instance",
	worldName: "Hello World",
	version: "1.19.20",
	protocol: 544,
	connectedPlayers: 0,
	maxConnectedPlayers: 20,
	//@ts-ignore
	ip: "mco.mineplex.com",
	//@ts-ignore
	port: 19132,
	log: true,
	connectionType: 6, //@ts-ignores
	keepProtocolConstant: false,
	autoFriending: false,

	accounts: [accounts[0]],
	tokenPath: "./auth",
});
