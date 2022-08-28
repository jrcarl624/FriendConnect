# FriendConnect

## WARNING

**BEFORE YOU USE THIS TOOL, PLEASE READ THE FOLLOWING:
WE _AS CONTRIBUTORS_ ARE NOT RESPONSIBLE FOR ANY DAMAGE OR LOSS CAUSED BY THIS APP.
USE AN ALT ACCOUNT, JUST IN CASE THERE IS AN ISSUE WITH THIS METHOD.**

## About

This is a project for minecraft bedrock/(java with geyser) that allows you to join servers via the in game friends tab. The most notable differing factor is, that console players can connect to servers without using an advanced method.

This project is still in development, so please be patient if there are issues.

The best way to use this tool at the moment is as a node module. Read the tutorial below for more information of how to set this up.

## Discord

If you want to be notified when any changes occur to this project, you can join the discord server.<br>
**_[FriendConnect Support Server Invite](https://discord.gg/PYENSbUWa2)_**

## How it works in game

[![A New Realms Replacement, A new method for joining servers on console.](https://res.cloudinary.com/marcomontalbano/image/upload/v1657258514/video_to_markdown/images/youtube--77qXotN9jGo-c05b58ac6eb4c4700831b2b3070cd403.jpg)](https://youtu.be/77qXotN9jGo "A New Realms Replacement, A new method for joining servers on console.")

## How to use it:

```tty
$ npm install friend-connect
```

Create a file and name it whatever you want.
Then paste this example into it:

```js
import { Session } from "friend-connect";

new Session({
	hostName: "Server Name", // The hostname of the server
	worldName: "Message of the Day: Hello World", // Use as a MOTD
	version: "1.19.21", // The version of the session, this can be any string.

	protocol: 545, //The protocol of the server you are connecting to.

	connectedPlayers: 0, // Used as a fallback if pinging the server fails.
	maxConnectedPlayers: 40, // Used as a fallback if pinging the server fails.

	ip: "example.com", // The ip of the server you are using.
	port: 19132, // The port of the server you are using.
	connectionType: 6, // I don't recommend changing this.

	log: true, // If you want to see the console output set to true.
	joinability: "joinable_by_friends", // The joinability of the session, if this is changed only one account can be used to connect to the session.
	autoFriending: true, // Set this to true if you want to automatically add people who follow the accounts.

	tokenPath: "./auth", // The path to the directory that contains the authentication tokens.

	accounts: ["example.com", "example.com"], // A list of emails that correspond to accounts you want to use with FriendConnect.

	//These are values retrieved from the server on when the server advertisement is fetched, if true it will use a value from above.
	constants: {
		//worldName: true,
		//hostName: true,
		maxConnectedPlayers: true,
		connectedPlayers: true,
		//protocol: true,
		version: true,
	},
});
```

Set `type` to `module` in the package.json file.

You can run the file with `node --es-module-specifier-resolution=node ./path/to/file.js`.

## To Do List

-   [x] Add a way to fetch the version and protocol of the server on session Update.
-   [x] Add automatically querying the player numbers from the server on session Update.
-   [ ] Add the ability to provide an array of strings to be chosen from for the hostName and worldName that is rotated through on session Update.
-   [ ] Check if the user owns any games if so send an error telling them to use an alt account.
    > I was unable to get the games owned, but I do check if there are achievements on the profile.
-   [x] Add an option to disable auto friending.
-   [ ] Make a user friendly way to use this tool like a discord bot or something.
-   [ ] Add a cli tool maybe.

## Testing

If you are contributing to this project, make a `.env` file in the root directory.
This file is used in `./test/index.js` to test the tool.

```ini
EMAIL="emails@example.com"
EMAIL2="emails@example.com"
IP="example.com"
PORT=19132
#FRIEND_CONNECT_DEBUG=true
```

## Credit

This project is inspired by and is a js port of the [rtm516/MCXboxBroadcast](https://github.com/rtm516/MCXboxBroadcast) from java.

FriendConnect adds a key feature that makes the friending automated.

I worked with [rtm516](https://github.com/rtm516) to figure out the uri and headers for finding the followers of an xbox profile.
