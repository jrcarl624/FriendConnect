import { Session } from "../dist/index.js";
import { config } from "dotenv";

if (process.env.USE_DOTENV === "true") {
	config();
}


// check if the env for port, ip, protocol, and accounts are set if not error
if (!process.env.IP || !process.env.PROTOCOL || !process.env.ACCOUNTS) {
	console.error("Please set the variables for IP, PROTOCOL, and ACCOUNTS");
	process.exit(1);
}

let accounts = process.env.ACCOUNTS.split(",");


let maxConnectedPlayers = 40;

if (process.env.CONNECTED_PLAYERS) {
	maxConnectedPlayers = parseInt(process.env.CONNECTED_PLAYERS);
}

let connectedPlayers = 0;

if (process.env.MAX_CONNECTED_PLAYERS) {
	connectedPlayers = parseInt(process.env.MAX_CONNECTED_PLAYERS);
}

let port = 19132;

if (process.env.PORT) {
	port = parseInt(process.env.PORT);
}

let connectionType = 6;

if (process.env.CONNECTION_TYPE) {
	connectionType = parseInt(process.env.CONNECTION_TYPE);
}


let autoFriending = true;

if (process.env.AUTO_FRIENDING) {
	autoFriending = process.env.AUTO_FRIENDING === "true";
}

let pingServerForInfo = true;

if (process.env.PING_SERVER_FOR_INFO) {
	pingServerForInfo = process.env.PING_SERVER_FOR_INFO === "true";
}

let protocol = 0;

if (process.env.PROTOCOL) {
	protocol = parseInt(process.env.PROTOCOL);
}
let log = false;
if (process.env.LOG) {
	log = process.env.LOG === "true";
}

let constantWorldName = false;

if (process.env.CONSTANT_WORLD_NAME) {
	constantWorldName = process.env.CONSTANT_WORLD_NAME === "true";
}

let constantHostName = false;

if (process.env.CONSTANT_HOST_NAME) {
	constantHostName = process.env.CONSTANT_HOST_NAME === "true";
}

let constantMaxConnectedPlayers = false;

if (process.env.CONSTANT_MAX_CONNECTED_PLAYERS) {
	constantMaxConnectedPlayers =
		process.env.CONSTANT_MAX_CONNECTED_PLAYERS === "true";
}

let constantConnectedPlayers = false;

if (process.env.CONSTANT_CONNECTED_PLAYERS) {
	constantConnectedPlayers =
		process.env.CONSTANT_CONNECTED_PLAYERS === "true";
}

let constantProtocol = false;

if (process.env.CONSTANT_PROTOCOL) {
	constantProtocol = process.env.CONSTANT_PROTOCOL === "true";
}

let constantVersion = false;

if (process.env.CONSTANT_VERSION) {
	constantVersion = process.env.CONSTANT_VERSION === "true";
}

let constants = {
	worldName: constantWorldName,

	hostName: constantHostName,

	maxConnectedPlayers: constantMaxConnectedPlayers,

	connectedPlayers: constantConnectedPlayers,

	protocol: constantProtocol,

	version: constantVersion,
};


let accLimit = 1;

if (process.env.ACC_LIMIT) {
	accLimit = parseInt(process.env.ACC_LIMIT);


	if (accLimit > accounts.length) {
		console.error(
			"Please remove one of your emails from the accounts variable."
		);
		process.exit(1);
	}
}


for (let i of accounts) {
	if (!i.match(/.+@.+\..+/)) {
		console.error("Please make sure all of your emails are valid emails.");
		process.exit(1);
	}
}

// log all the variables

console.log(`
IP: ${process.env.IP}
PORT: ${port}
PROTOCOL: ${protocol}
ACCOUNTS: ${accounts}
MAX_CONNECTED_PLAYERS: ${maxConnectedPlayers}
CONNECTED_PLAYERS: ${connectedPlayers}
CONNECTION_TYPE: ${connectionType}
AUTO_FRIENDING: ${autoFriending}
PING_SERVER_FOR_INFO: ${pingServerForInfo}
LOG: ${log}
CONSTANT_WORLD_NAME: ${constantWorldName}
CONSTANT_HOST_NAME: ${constantHostName}
CONSTANT_MAX_CONNECTED_PLAYERS: ${constantMaxConnectedPlayers}
CONSTANT_CONNECTED_PLAYERS: ${constantConnectedPlayers}
CONSTANT_PROTOCOL: ${constantProtocol}
CONSTANT_VERSION: ${constantVersion}
ACC_LIMIT: ${accLimit}
`);

// create the session

new Session({
	hostName: process.env.HOSTNAME || "FriendConnect",
	worldName: process.env.WORLD_NAME || "Message of the Day: Hello World",

	version: process.env.VERSION || "Version",
	protocol,
	connectedPlayers,
	maxConnectedPlayers,

	ip: process.env.IP,

	port,
	connectionType,

	log,
	//@ts-ignore
	joinability: process.env.JOINABILITY || "joinable_by_friends",

	autoFriending,

	pingServerForInfo,

	tokenPath: "./auth",
	accounts,

	constants,
});
