import { Session } from "../dist/index.js";
import { config } from "dotenv";
config();
new Session({
	hostName: "FriendConnect Testing Instance",
	worldName: "Hello World",
	version: "1.19.11",
	protocol: 534,
	players: 0,
	maxPlayers: 20,
	ip: process.env.IP,
	port: process.env.PORT,
	log: true,
	connectionType: 6,
	keepVersionAndProtocolConstant: true,
	autoFriending: true,
	email: process.env.EMAIL,
	tokenPath: "./auth",
});
