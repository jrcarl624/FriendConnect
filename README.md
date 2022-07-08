# Friend Connect

## About

This is a project for minecraft bedrock that allows you to join servers via the in game friends tab. Allowing console players to connect to servers.

## How it works in game

[![A New Realms Replacement, A new method for joining servers on console.](https://res.cloudinary.com/marcomontalbano/image/upload/v1657258514/video_to_markdown/images/youtube--77qXotN9jGo-c05b58ac6eb4c4700831b2b3070cd403.jpg)](https://youtu.be/77qXotN9jGo "A New Realms Replacement, A new method for joining servers on console.")

## How to use it:

```js
const { Authflow, Titles } = require("prismarine-auth");
const { Session } = require("friend-connect");

new Authflow("TailvileMC", "./", {
	authTitle: Titles.MinecraftNintendoSwitch,
	deviceType: "Nintendo",
})
	.getXboxToken()
	.then((token) => {
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
	});
```

## To Do List

-   [ ] Add a way to fetch the version and protocol of the server on session Update.
-   [ ] Add automatically querying the player numbers from the server on session Update.
-   [ ] Add the ability to provide an array of strings to be chosen from for the hostName and worldName that is rotated through on session Update.

## Credit

This project is a js port of the [rtm516/MCXboxBroadcast](https://github.com/rtm516/MCXboxBroadcast).

This port adds a key feature that makes the friending automated.

I worked with [rtm516](https://github.com/rtm516) to figure out the uris for finding the followers of an xbox profile and friending people. After I tested the uris, He implemented the friending feature into his project.
