/**
 * The Achievement object has the following specification. All members are required.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-achievementv2
 */
export interface Achievement {
	/**
	 * Resource identifier
	 */
	id: string;
	/**
	 * SCID for this resource.
	 * Identifies the title(s) this achievement is related to.
	 */
	serviceConfigId: string;
	/**
	 * The localized Achievement name
	 */
	name: string;
	titleAssociations: TitleAssociation[];
	progressState: ProgressState;
	/**
	 * The user's progression within the achievement.
	 */
	progression: Progression;
	/**
	 * The media assets associated with the achievement, such as image IDs.
	 */
	mediaAssets: MediaAsset[];
	/**
	 * The platform the achievement was earned on.
	 */
	platform: string;
	/**
	 * Whether or not the achievement is secret.
	 */
	isSecret: boolean;
	/**
	 * The description of the achievement when unlocked.
	 */
	description: string;
	/**
	 * The description of the achievement before it is unlocked.
	 */
	lockedDescription: string;
	/**
	 * The ProductId the achievement was released with.
	 */
	productId: string;
	/**
	 * The type of achievement (not the same as the previous type on legacy achievements)
	 */
	achievementType: AchievementType;
	participationType: ParticipationType;
	/**
	 * The time window during which the achievement may be unlocked. Only supported for Challenges.
	 */
	timeWindow: TimeWindow;
	/**
	 * The collection of rewards earned when unlocked.
	 */
	rewards: Reward[];
	/**
	 * The estimated time the achievement will take to earn.
	 */
	estimatedTime: TimeSpan;
	/**
	 * A deeplink into the title.
	 */
	deeplink: string;
	/**
	 * Whether or not the achievement is revoked by enforcement.
	 */
	isRevoked: boolean;
}

type TimeSpan = `${number}:${number}:${number}`;

/**
 * The reward associated with the achievement.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-reward
 */
export interface Reward {
	/**
	 * The user-facing name of the Reward.
	 */
	name: string | null;
	/**
	 * The user-facing description of the Reward.
	 */
	description: string | null;
	/**
	 * The Reward's value.
	 */
	value: string;
	type: RewardType;
	/**
	 * The type of value.
	 * @type {Requirement} for more information.
	 */
	valueType: string;
}

enum RewardType {
	/**
	 * An unknown and unsupported reward type was configured.
	 */
	invalid = 0,
	/**
	 * An unknown and unsupported reward type was configured.
	 */
	Gamerscore = 1,
	/**
	 * The reward is defined and delivered by the title.
	 */
	inApp = 2,
	/**
	 * The reward is a digital asset.
	 */
	Art = 3,
}

export interface TimeWindow {
	startDate: string;
	endDate: string;
}

/**
 * A title that is associated with the achievement.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-titleassociation
 */
export interface TitleAssociation {
	/**
	 * The localized name of the content.
	 */
	name: string;
	/**
	 * The titleId (32-bit unsigned integer, returned in decimal).
	 */
	id: string;
	/**
	 * Specific version of the associated title (if appropriate).
	 */
	version: string;
}
enum ProgressState {
	/**
	 * The achievement progression is in an unknown state.
	 */
	Invalid = 0,
	/**
	 * The achievement has been unlocked.
	 */
	Achieved = 1,
	/**
	 * The achievement is locked but the user has made progress toward unlocking it.
	 */
	InProgress = 2,
	/**
	 * The achievement is locked and the user has not made any progress toward unlocking it.
	 */
	NotStarted = 3,
}
/**
 * The unlock criteria for the Achievement and how far the user is toward meeting them.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-requirement
 */
export interface Requirement {
	/**
	 * The ID of the requirement.
	 */
	id: string;
	/**
	 * The current value of progression toward the requirement.
	 */
	current: string;
	/**
	 * The target value of the requirement.
	 */
	target: string;
	/**
	 * The operation type of the requirement. Valid values are Sum, Minimum, Maximum.
	 */
	operationType: "Sum" | "Minimum" | "Maximum";
	/**
	 * The participation type of the requirement. Valid values are Individual, Group.
	 */
	ruleParticipationType: ParticipationType;
}
/**
 * The user's progression toward unlocking the achievement.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-progression
 */
export interface Progression {
	/**
	 * The requirements to earn the achievement and how far along the user is toward unlocking it.
	 */
	requirements: Requirement[];
	/**
	 * The time the achievement was first unlocked.
	 */
	timeUnlocked: string;
}

/**
 * The media assets associated with the achievement or its rewards.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-mediaasset
 */
export interface MediaAsset {
	/**
	 * The name of the MediaAsset, such as "tile01".
	 */
	name: string;
	/**
	 * The type of the media asset
	 */
	type: MediaAssetType;
	/**
	 * The URL of the MediaAsset.
	 */
	url: string;
}
enum MediaAssetType {
	/**
	 * The achievement icon.
	 */
	icon = 0,
	/**
	 * The digital art asset.
	 */
	art = 1,
}
enum AchievementType {
	/**
	 * An unknown and unsupported achievement type.
	 */
	invalid = 0,
	/**
	 * An achievement that has no end-date and can be unlocked at any time.
	 */
	persistent = 1,
	/**
	 * An achievement that has a specific time window during which it can be unlocked.
	 */
	challenge = 2,
}

type ParticipationType = "Individual" | "Group";
/**
 * A formatted and localized string about one or more users' rich presence.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-activityrecord#sample-json-syntax
 */
export interface ActivityRecord {
	/**
	 * The rich presence string, formatted and localized.
	 */
	richPresence: string;
	/**
	 * What the user is watching or listening to.
	 */
	media: MediaRecord;
}
/**
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-mediarecord
 */
export interface MediaRecord {
	/**
	 * Identifier of the media used by the Bing catalog or provider catalog.
	 */
	id: string;
	/**
	 * How to interpret the media identifier. Possible values include "bing" and "provider".
	 */
	idType: string;
	/**
	 * Localized name of the media content.
	 */
	name: string;
}

/**
 * A request for information about one or more users' rich presence.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-activityrequest
 */
export interface ActivityRequest {
	/**
	 * The friendly name of the rich presence string that should be used.
	 */
	richPresence: RichPresenceRequest;
	/**
	 * Media information for what the user is watching or listening to.
	 */
	media: MediaRequest;
}

/**
 * Request for information about which rich presence information should be used.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-richpresencerequest
 */
export interface RichPresenceRequest {
	/**
	 * The friendlyName of the rich presence string to use.
	 */
	id: string;
	/**
	 * Scid that tells us where the rich presence strings are defined.
	 */
	scid: string;
	/**
	 * Array of friendlyName strings with which to finish the rich presence string. Only enumeration-friendly names should be specified, not stats. Leaving this empty will remove any previous value.
	 */
	params: string[];
}
/**
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-mediarequest
 */
export interface MediaRequest {
	/**
	 * Identifier of the media used by the Bing catalog or provider catalog.
	 */
	id: string;
	/**
	 * How to interpret id. Possible values include "bing" and "provider".
	 */
	idType: string;
}
/**
 * Contains aggregated data for a user's fitness sessions.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-aggregatesessionsresponse
 */
export interface AggregateSessionsResponse {
	/**
	 * Total duration of sessions in seconds over the aggregation period.
	 */
	totalDurationInSeconds: number;
	/**
	 * Total energy burned—in joules—over the aggregation period.
	 */
	totalJoules: number;
	/**
	 * Total number of sessions over the aggregation period.
	 */
	totalSessions: number;
	/**
	 * Weighted average metabolic equivalent of task (MET) value over the aggregation period. The MET value is the ratio of an individual's metabolic rate during an activity relative to the individual's metabolic rate at rest. Because the metabolic rate for resting is 1.0 regardless of an individual's weight, and MET values are relative to an individual's resting metabolic rate, they can be used to compare the intensity of an activity being performed by individuals of different weights.
	 */
	weightedAverageMets: number;
}

export interface BatchRequest {
	/**
	 * 	List XUIDs of users whose presence you want to learn, with a maximum of 1100 XUIDs at a time.
	 */
	users: string[];
	/**
	 * 	List of device types used by the users you want to know about. If the array is left empty, it defaults to all possible device types (that is, none are filtered out).
	 */
	deviceTypes: string[];
	/**
	 * List of device types whose users you want to know about. If the array is left empty, it defaults to all possible titles (that is, none are filtered out).
	 */
	titles: number[];
	/**
	 * Possible values:
	 * user - get user nodes
	 * device - get user and device nodes
	 * title - get basic title level information
	 * all - get rich presence information, media information, or both
	 * The default is "title".
	 */
	level: string;
	/**
	 * 	If this property is true, the batch operation will filter out records for offline users (including cloaked ones). If it is not supplied, both online and offline users will be returned.
	 */
	onlineOnly: boolean;
}
/**
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-deviceendpoint
 */
export interface DeviceEndpoint {
	/**
	 * A friendly name for the device, if applicable. Currently this value is not used.
	 */
	deviceName?: string;
	/**
	 * The URL that the client platform (Windows or Windows Phone) has obtained from its push notification service (WNS or MPNS).
	 */
	endpointUri: string;
	/**
	 *  The desired language of notifications sent to this endpoint. Can be a list of comma-separated values in preference order. Example: "de-DE, en-US, en".
	 */
	locale: string;
	/**
	 *  Currently supported values are "WindowsPhone" and "Windows". If not specified, it is derived from the Device token.
	 */
	platform?: string;
	/**
	 * The format of this string is particular to each platform. Currently this value is not used.
	 */
	platformVersion?: string;
	/**
	 * Unique identifier for the "app instance" (device/user combination). Best practice implementation is for an app to generate a random GUID upon install/first-run, and continue to use that value on subsequent runs of the app.
	 */
	systemID: string;
	/**
	 * The Title ID of the game issuing the call to the service.
	 */
	titleId: number;
}
/**
 * Information about a device, including its type and the titles active on it.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-devicerecord
 */
export interface DeviceRecord {
	/**
	 * 	The device type of the device. Possibilities include "D", "Xbox360", "MoLIVE" (Windows), "WindowsPhone", "WindowsPhone7", and "PC" (G4WL). If the type is unknown (for example iOS, Android, or a title embedded in a web browser), "Web" is returned.
	 */
	type: string;
	/**
	 * The list of titles active on this device.
	 */
	titles: TitleRecord[];
}
/**
 * Information about a title, including its name and a last-modified timestamp.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-titlerecord
 */
export interface TitleRecord {
	/**
	 * TitleId of the record.
	 */
	id: number;
	/**
	 * Localized name of the title.
	 */
	name: string;
	/**
	 * The activity of the user in the title. Only returned if depth is "all".
	 */
	activity: ActivityRecord;
	/**
	 * UTC timestamp when the record was last updated.
	 */
	lastModified: string;
	/**
	 * The location of the app within the user export interface. Possibilities include "fill", "full", "snapped", or "background". The default is "full" for devices without the ability to place apps.
	 */
	placement: string;
	/**
	 * 	The state of the title. Can be "active" or "inactive" (the default). The title sets the state based on its own criteria for activity and inactivity.
	 */
	state: string;
}
//TODO: Do this export interface, feedback types are more described in the url below, implement this
/**
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-feedback
 */
export interface Feedback {
	/**
	 * An object describing the MPSD session this feedback relates to, or null.
	 */
	sessionRef: MultiplayerSessionReference;
	/**
	 * The type of feedback. Possible values are defined in the Microsoft.Xbox.Services.Social.ReputationFeedbackType.
	 */
	feedbackType: string;
	/**
	 * User-supplied text that the sender added to explain the reason the feedback was submitted.
	 */
	textReason: string;
	/**
	 * 	The ID of a user-supplied voice file from Kinect that the sender added to explain the reason the feedback was submitted (Base-64).
	 */
	voiceReasonId: string;
	/**
	 * The ID of a resource that can be used as evidence of the feedback being submitted, for example, a video file recorded during game play.
	 */
	evidenceId: string;
}

type FeedbackTypes = null;
/**
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-gameclip
 */
export interface GameClip {
	/**
	 * The ID assigned to the game clip.
	 */
	gameClipId: string;
	/**
	 * The state of the game clip in the system.
	 */
	state: string;
	/**
	 * The date and time that the recording was started, in UTC (ISO 8601 format).
	 */
	dateRecorded: string;
	/**
	 * Last modified time of the game clip or its metadata, in UTC (ISO 8601 format).
	 */
	lastModified: string;
	/**
	 * The user-entered non-localized string for the game clip.
	 */
	userCaption: string;
	/**
	 * The type of clip. Can be multiple values, and will be comma-delimited if so.
	 */
	type: string;
	/**
	 * How the clip was sourced.
	 */
	source: string;
	/**
	 * The visibility of the game clip once it is published in the system.
	 */
	visibility: string;
	/**
	 * The duration of the game clip in seconds.
	 */
	durationInSeconds: number;
	/**
	 * SCID to which the game clip is associated.
	 */
	scid: string;
	/**
	 * The rating associated with the game clip, in the range 0.0 to 5.0.
	 */
	rating: number;
	/**
	 * The rating associated with the game clip, in the range 0.0 to 5.0.
	 */
	ratingCount: number;
	/**
	 * The number of views associated with the game clip.
	 */
	views: number;
	/**
	 * The title-specific property bag.
	 * The console-specific property bag.
	 */
	titleData: string;
	thumbnails: GameClipThumbnail[];
	gameClipUris: GameClipUri[];
	/**
	 * The XUID of the owner of the game clip, marshaled as a string.
	 */
	xuid: string;
	/**
	 * The localized version of the clip's name, based on the input locale of the request as looked up from the title management system.
	 */
	clipName: string;
}
/**
 * An optional part of the response to the /users/{ownerId}/scids/{scid}/clips/{gameClipId}/uris/format/{gameClipUriType} API.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-gameclipsserviceerrorresponse
 */
export interface GameClipsServiceErrorResponse {
	errorSource: string;
	/**
	 * Code associated with the error (can be null).
	 */
	errorResponseCode: number | null;
	/**
	 * Additional details about the error.
	 */
	errorMessage: string;
}
/**
 * Contains the information related to an individual thumbnail. There can be multiple sizes per clip, and it is up to the client to select the proper one for display.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-gameclipthumbnail
 */
export interface GameClipThumbnail {
	/**
	 * The URI for the thumbnail image.
	 */
	uri: string;
	/**
	 * The total file size of the thumbnail image.
	 */
	fileSize: number;
	/**
	 * The type of thumbnail image.
	 */
	thumbnailType: unknown;
	width: number;
	height: number;
}
/**
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-gameclipuri
 */
export interface GameClipUri {
	/**
	 * The URI to the location of the video asset.
	 */
	uri: string;
	/**
	 * The total file size of the thumbnail image.
	 */
	fileSize: string;
	/**
	 * The type of the URI.
	 */
	uriType: string;
	/**
	 * 	The expiration time of the URI that is included in this response. If the URL is empty or deemed expired before playback, callers should call the RefreshUrl API.
	 */
	expiration: string;
}
/**
 * A JSON object defining data for a message in a game session's message queue.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-gamemessage
 */
export interface GameMessage {
	/**
	 * The Base64-encoded data that the game client wants to send to the other game clients. This value is opaque to the server.
	 */
	data: string[];
	/**
	 * The Xbox user ID of the player sending the message.
	 */
	senderXuid: number;
	/**
	 * The sequence number of the game message. This value is assigned by the server. Sequence numbers are guaranteed to be monotonically increasing, but might not be consecutive. Sequence numbers are unique within a message queue, but not between message queues.
	 */
	sequenceNumber: number;
	/**
	 * The index of the session message queue for the message. Possible values are 0-3.
	 */
	queueIndex: 0 | 1 | 2 | 3;
	/**
	 * Time when the game message was created in the queue by the server, in UTC.
	 */
	timeStamp: string;
}
/**
 * A JSON object representing data that describes the results of a game session.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-gameresult
 */
export interface GameResult {
	/**
	 * Custom title-specific result data.
	 */
	blob: Uint8Array;
	/**
	 * 	The outcome of the player's participation in the game session. Valid values are "Win", "Loss", or "Tie
	 */
	outcome: "Win" | "Loss" | "Tie";
	/**
	 * The score that the player received in the game session.
	 */
	score: number;
	/**
	 * The player's time for the game session.
	 */
	time: number;
	/**
	 * The Xbox user ID of the player to whom the results apply.
	 */
	xuid: number;
}
/**
 * A JSON object representing game data for a multiplayer session.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-gamesession
 */
export interface GameSession {
	/**
	 * 	The date and time when the session was created, in UTC.
	 */
	creationTime: string;
	/**
	 * 1024 bytes of game-specific session data. This value is opaque to the server.
	 */
	customData: Uint8Array;
	/**
	 * The display name of the game session, with a maximum length of 128 characters. This value is opaque to the server.
	 */
	displayName: string;
	/**
	 * 	True if the session has ended, and false otherwise. Setting this field to true marks the game session as read-only, preventing further data from being submitted to the session.
	 */
	hasEnded: boolean;
	/**
	 * True if the session is closed and no more players can be added, and false otherwise. If this value is true, requests to join the session are rejected.
	 */
	isClosed: boolean;
	/**
	 * Maximum number of players that can be in the session concurrently. The range of values is 2-16. Once the session contains the maximum number of players, further requests to join the session are rejected.
	 */
	maxPlayers:
		| 2
		| 3
		| 4
		| 5
		| 6
		| 7
		| 8
		| 9
		| 10
		| 11
		| 12
		| 13
		| 14
		| 15
		| 16;
	/**
	 * A value that indicates the player who is allowed to remove other players from the session. Possible values are NoOne, Self, and AnyPlayer.
	 */
	playersCanBeRemovedBy: PlayerAcl;
	/**
	 * An array of players in the session. The roster contains current players and players who were previously in the session, but have left. The order of players in the roster never changes. New players are added to the end of the array.
	 */
	roster: Player[];
	/**
	 * The number of players who can still join the session before the maximum number of players is reached. This value is read-only, and is always less than the value of the maxPlayers field.
	 */
	seatsAvailable: number;
	/**
	 * 	The session ID assigned by the MPSD when the session is created. This value is usually included in the URI when accessing the information stored in a session.
	 */
	sessionId: string;
	/**
	 * The ID of the title creating the game session.
	 */
	titleId;
	/**
	 * The game variant. This value is opaque to the server.
	 */
	variant: number;
	/**
	 * 	A value that indicates session visibility. Possible values are: PlayersCurrentlyInSession, PlayersEverInSession, and Everyone.
	 */
	visibility: VisibilityLevel;
}
type VisibilityLevel =
	| "PlayersCurrentlyInSession"
	| "PlayersEverInSession"
	| "Everyone";

type PlayerAcl = "NoOne" | "Self" | "AnyPlayer";
/**
 * Contains data for a player in a game session.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-player
 */
export interface Player {
	/**
	 * 1024 bytes of Base64 encoded game-specific player data. This value is opaque to the server.
	 */
	customData: Uint8Array;
	/**
	 * Gamertag—a maximum of 15 characters—of the player. The client should use this value in the UI when identifying the player.
	 */
	gamertag: string;
	/**
	 * Indicates if the player is currently in the session or left the session.
	 */
	isCurrentlyInSession: boolean;
	/**
	 * The index of the player in the session.
	 */
	seatIndex: number;
	/**
	 * The Xbox User ID (XUID) of the player.
	 */
	xuid: number;
}

export interface GameSessionSummary {
	/**
	 * The date and time when the session was created, in UTC.
	 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-gamesessionsummary
	 */
	creationTime: string;
	/**
	 * 1024 bytes of game-specific session data. This value is opaque to the server.
	 */
	customData: Uint8Array | null;
	/**
	 * The display name of the game session, with a maximum length of 128 characters. This value is opaque to the server.
	 */
	displayName: string;
	sessionId: string;
	/**
	 * The game variant. This value is opaque to the server.
	 */
	variant: number;
	titleId: number;
	hasEnded: boolean;
}
/**
 * Wraps the game clip.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-getclipresponse
 */
export interface GetClipResponse {
	/**
	 * A single game clip that satisfied the query.
	 */
	gameClip: GameClip;
}
/**
 * A JSON object representing the statistics for a hopper.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-hopperstatsresults
 */
export interface HopperStatsResults {
	/**
	 * The name of the selected hopper.
	 */
	hopperName: string;
	/**
	 * Average matching time for the hopper (an integral number of seconds).
	 */
	waitTime: number;
	/**
	 * The number of people waiting for matches in the hopper.
	 */
	population: number;
}
/**
 * The body of a POST GameClip upload request.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-initialuploadrequest
 */
export interface InitialUploadRequest {
	/**
	 * 	The string ID for the text to use as the name for the clip. This is managed and localized in the config file for the title by the developer of the title.
	 */
	greatestMomentId: string;
	/**
	 * Alternate user-entered name for game clip up to a maximum length of 250 characters.
	 */
	userCaption?: string;
	/**
	 * Game session reference during which the recording was done.
	 */
	sessionRef?: MultiplayerSessionReference;
	/**
	 * The time the recording was started, in UTC. Marshalled as a string in ISO 8601 format (see url below for more information).
	 * @url https://www.w3.org/TR/NOTE-datetime
	 */
	dateRecorded: string;
	/**
	 * The length of the clip in seconds.
	 */
	durationInSeconds: number;
	/**
	 * Number of blocks into which file will be divided. Omit if file will be transmitted in a single request.
	 */
	expectedBlocks?: number;
	/**
	 * File size in bytes of the video that will be uploaded.
	 */
	fileSize: number;
	/**
	 * The type of clip, marshaled as a string value of the enumeration that is comma-delimited.
	 */
	type: GameClipType;
	/**
	 * Specifies how the clip was sourced, marshaled as a string value of the enumeration.
	 */
	source: GameClipSource;
	/**
	 * Specifies the visibility of the game clip once it is published in the system.
	 */
	visibility: GameClipVisibility;
	/**
	 * Property bag for title-specific properties associated with this clip. Stored and returned as-is. Title developers can use this field to persist their own metadata about a clip.
	 */
	titleData?: string;
	/**
	 * Property bag for console-specific properties associated with this clip. Stored and returned as is. Console Platform can use this field to persist their own metadata about a clip.
	 */
	systemProperties?: string;
	/**
	 * A list of the users in the current session.
	 */
	usersInSession?: number;

	thumbnailSource?: ThumbnailSource;
	/**
	 * Specifies the offset (in milliseconds) for offset generated thumbnails. Only specified when thumbnailSource is set to Offset.
	 */
	thumbnailOffsetMillseconds: number;
	/**
	 * Sets the clip to be saved to the user's quota instead of FIFO storage. Defaults to false.
	 */
	savedByUser?: boolean;
}
/**
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/enums/gvr-enum-gamecliptypes
 */
enum GameClipType {
	/**
	 * Game clip type is unknown or not set. (not valid for upload)
	 */
	None = 0,
	/**
	 * Game clip does not include asset data - only metadata. (for future use)
	 */
	MetadataOnly = 1,
	/**
	 * Game clip is initiated by a developer/title.
	 */
	DeveloperInitiated = 2,
}
/**
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/enums/gvr-enum-gameclipsource
 */
enum GameClipSource {
	/**
	 * Game clip source is unknown or not set. (not valid for upload)
	 */
	None,
	/**
	 * Game clip originated by the Xbox console platform.
	 */
	Console,
	/**
	 * Game clip originated by a title.
	 */
	TitleDirect,
	/**
	 * Game clip is an achievement type.
	 */
	Intermediate,
	/**
	 * Game clip is from an intermediate app like an editor.
	 */
	UserInitiated,
}
/**
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/enums/gvr-enum-gameclipvisibility
 */
enum GameClipVisibility {
	/**
	 * Visibility is not specified. This is an invalid value in most cases.
	 */
	None = 0,
	/**
	 * Game clip visibility determined by Xbox LIVE privacy settings.
	 */
	Default = 1,
	/**
	 * Game clip is only available to the original XUID that created it.
	 */
	Owner = 2,
	/**
	 * Game clip is only available for the original Title that created it.
	 */
	Title = 3,
	/**
	 * Game clip is available for anyone in Xbox LIVE.
	 */
	Public = 4,
}
/**
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/enums/gvr-enum-thumbnailsource
 */
enum ThumbnailSource {
	/**
	 * A Large and Small sized thumbnail are generated from the 3 second point in the clip.
	 */
	Default = 0,
	/**
	 * A Large and Small sized thumbnail are generated from the value specified in the InitialUploadRequest for the clip.
	 */
	Offset = 1,
	/**
	 * Thumbnails are generated and uploaded independent of the GameClips service.
	 */
	Upload = 2,
}
/**
 * https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-initialuploadresponse
 */
export interface InitialUploadResponse {
	/**
	 * ID assigned for the upload data request.
	 */
	gameClipId: string;
	/**
	 * Location to which the game clip should be uploaded.
	 */
	uploadUri: string;
	/**
	 * Location to which the large thumbnail should be uploaded. Presence of this field is determined by the ThumbnailSource Enumeration value in the InitialUploadRequest (will be present when the upload is specified).
	 */
	largeThumbnailUri?: string;
	/**
	 * Location to which the small thumbnail should be uploaded. Presence of this field is determined by the ThumbnailSource Enumeration value in the InitialUploadRequest (will be present when the upload is specified).
	 */
	smallThumbnailUri?: string;
}
/**
 * The core inventory item represents the standard item on which an entitlement can be granted.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-inventoryitem
 */
export interface InventoryItem {
	/**
	 * Unique identifier for this specific inventory item.
	 */
	url: string;
	/**
	 * Note: Games are designated by GameV2, consumables are GameConsumable, and durable DLC is GameContent.
	 */
	itemType:
		| "Unknown"
		| "Game"
		| "Movie"
		| "TVShow"
		| "MusicVideo"
		| "GameTrial"
		| "ViralVideo"
		| "TVEpisode"
		| "TVSeason"
		| "TVSeries"
		| "VideoPreview"
		| "Poster"
		| "Podcast"
		| "Image"
		| "BoxArt"
		| "ArtistPicture"
		| "GameContent"
		| "GameDemo"
		| "Theme"
		| "XboxOriginalGame"
		| "GamerTile"
		| "ArcadeGame"
		| "GameConsumable"
		| "Album"
		| "AlbumDisc"
		| "AlbumArt"
		| "GameVideo"
		| "BackgroundArt"
		| "TVTrailer"
		| "GameTrailer"
		| "VideoShort"
		| "Bundle"
		| "XnaCommunityGame"
		| "Promotional"
		| "MovieTrailer"
		| "SlideshowPreviewImage"
		| "ServerBackedGames"
		| "Marketplace"
		| "AvatarItem"
		| "LiveApp"
		| "WebGame"
		| "MobileGame"
		| "MobilePdlc"
		| "MobileConsumable"
		| "App"
		| "MetroGame"
		| "MetroGameContent"
		| "MetroGameConsumable"
		| "GameLayer"
		| "GameActivity"
		| "GameV2"
		| "SubscriptionV2"
		| "Subscription";
	/**
	 * This is the set of "containers" that contain this item. A user's inventory can be queried for items that belong to a specific container. These containers are determined when the item is added to the inventory by purchase.
	 */
	containers: string;
	/**
	 * Date and time the item was added to the user's inventory.
	 */
	obtained: string;
	/**
	 * 	Date and time the item became or will become available for use.
	 */
	startDate: string;
	/**
	 * Date and time the item became or will become unusable.
	 */
	endDate: string;
	state: "Unavailable" | "Available" | "Suspended" | "Expired";
	/**
	 * True if this entitlement is a trial; otherwise, false. If you buy the trial version of an entitlement and then buy the full version, you will receive both.
	 */
	trial: boolean;
	/**
	 * How much time is remaining on the trial, in minutes.
	 * @example "23:12:14"
	 */
	trialTimeRemaining: string | null;
	/**
	 * If the items is consumable, this contains an inline representation of the unique identifier (link) for the consumable inventory item, as well as its current quantity.
	 */
	consumable: ConsumableInventoryItem[];
}

export interface ConsumableInventoryItem {
	/**
	 * Unique identifier for the specific consumable inventory item.
	 */
	url: string;
	/**
	 * The current quantity of this inventory item.
	 */
	quantity: number;
}
/**
 * Information about when the system last saw a user, available when the user has no valid DeviceRecord.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-lastseenrecord
 */
export interface LastSeenRecord {
	/**
	 * The type of the device on which the user was last present.
	 */
	deviceType: string;
	/**
	 * The identifier of the title on which the user was last present.
	 */
	titleId: number;
	/**
	 * The name of the title on which the user was last present.
	 */
	titleName: string;
	/**
	 * UTC timestamp indicating when the user was last present.
	 */
	timestamp: DateTime;
}

type DateTime =
	`${number}-${number}-${number}T${number}:${number}:${number}.${number}`;

/**
 * A JSON object representing a match ticket, used by players to locate other players through the multiplayer session directory (MPSD).
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-matchticket
 */
export interface MatchTicket {
	/**
	 * Service configuration identifier (SCID) for the session.
	 */
	serviceConfig: string;
	/**
	 * Name of the hopper in which this ticket should be placed.
	 */
	hopperName: string;
	/**
	 * 	Maximum wait time (integral number of seconds).
	 */
	giveUpDuration: number;
	/**
	 * 	A value indicating if the session must be reused as the session into which to match. Possible values are "always" or "never".
	 */
	preserveSession: "always" | "never";
	/**
	 * MultiplayerSessionReference object for the session in which the player or group is currently playing. This member is always required.
	 */
	ticketSessionRef: MultiplayerSessionReference;
	/**
	 * 	Collection of user-provided attributes and values about the tickets for the players.
	 */
	ticketAttributes: unknown[];
	/**
	 * Collection of player objects, each with a property bag of user-provided attributes.
	 */
	players: unknown[];
}
/**
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-paginginfo
 */
export interface PagingInfo {
	/**
	 * An opaque continuation token used to access the next page of results. Maximum 32 characters.Callers can supply this value in the continuationToken query parameter in order to retrieve the next set of items in the collection. If this property is null, then there are no additional items in the collection. This property is required and is provided even if the collection is being paged with skipItems.
	 */
	continueToken: string;
	/**
	 * The total number of items in the collection. This is not provided if the service is unable to provide a real-time view into the size of the collection.
	 */
	totalItems: number;
}
/**
 * Collection of PermissionCheckBatchRequest objects.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-permissioncheckbatchrequest
 */
export interface PermissionCheckBatchRequest {
	/**
	 * Array of targets to check permission against. Each entry in this array is either an Xbox User ID (XUID) or an anonymous off-network user for cross-network scenarios ("anonymousUser":"allUsers").
	 */
	users: User[];
	/**
	 * The permissions to check against each user.
	 */
	permissions: PermissionId[];
}

/**
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/enums/privacy-enum-permissionid
 */
enum PermissionId {
	/**
	 * 	Check whether or not the user can send a message with text content to the target user
	 */
	CommunicateUsingText,
	/**
	 * Check whether or not the user can communicate using video with the target user
	 */
	CommunicateUsingVideo,
	/**
	 * Check whether or not the user can communicate using voice with the target user
	 */
	CommunicateUsingVoice,
	/**
	 * 	Check whether or not the user can view the profile of the target user
	 */
	ViewTargetProfile,
	/**
	 * Check whether or not the user can view the game history of the target user
	 */
	ViewTargetGameHistory,
	/**
	 * Check whether or not the user can view the detailed video watching history of the target user
	 */
	ViewTargetVideoHistory,
	/**
	 * Check whether or not the user can view the detailed music listening history of the target user
	 */
	ViewTargetMusicHistory,
	/**
	 * Check whether or not the user can view the exercise info of the target user
	 */
	ViewTargetExerciseInfo,
	/**
	 * 	Check whether or not the user can view the online status of the target user
	 */
	ViewTargetPresence,
	/**
	 * Check whether or not the user can view the details of the targets video status (extended online presence)
	 */
	ViewTargetVideoStatus,
	/**
	 * Check whether or not the user can view the details of the targets music status (extended online presence)
	 */
	ViewTargetMusicStatus,
	/**
	 * Check whether or not the user can view the user-created content of other users
	 */
	ViewTargetUserCreatedContent,
}
/**
 * The results of a batch permission check for a list of permission values for multiple users.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-permissioncheckbatchresponse
 */
export interface PermissionCheckBatchResponse {
	/**
	 * A PermissionCheckBatchUserResponse (JSON) object for each permission that was asked for in the original request, in the same order as in that request.
	 */
	responses: PermissionCheckBatchUserResponse[];
}

/**
 * The reasons of a batch permission check for list of permission values for a single target user.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-permissioncheckbatchuserresponse
 */
export interface PermissionCheckBatchUserResponse {
	/**
	 *  This member is true if the requesting user is allowed to perform the requested action with the target user.
	 */
	User: User;
	/**
	 * A PermissionCheckResponse (JSON) for each permission that was asked for in the original request, in the same order as in the request.
	 */
	Permissions: PermissionCheckResponse[];
}
/**
 * The results of a check from a single user for a single permission setting against a single target user.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-permissioncheckresponse
 */
export interface PermissionCheckResponse {
	/**
	 * This member is true if the requesting user is allowed to perform the requested action with the target user.
	 */
	IsAllowed: boolean;
	/**
	 * If IsAllowed was false and the check was denied by something related to the requester, indicates why the permission was denied.
	 */
	results?: PermissionCheckResult[];
}

/**
 * The results of a check from a single user for a single permission setting against a single target user.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-permissioncheckresult
 */
export interface PermissionCheckResult {
	/**
	 * A PermissionResultCode value that indicates why the permission was denied if IsAllowed was false.
	 */
	reason?: string;
	/**
	 *  If the PermissionResultCode value in the reason member indicates that a privilege check for the requestor failed, this indicates which privilege failed.
	 */
	restrictedSetting?: string;
}
/**
 * Data about the online presence of a single user.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-presencerecord
 */
export interface PresenceRecord {
	/**
	 * The Xbox User ID (XUID) of the target user. The presence data provided is for this user.
	 */
	xuid: string;
	/**
	 * List of the user's device records.
	 */
	devices: DeviceRecord[];
	/**
	 * User's activity on Xbox LIVE. Possible values:
	 * @example "Online" // User has at least one device record.
	 * @example "Away" //User is signed into Xbox LIVE but not active in any title.
	 * @example "Offline" // User is not present on any device.
	 */
	state: "online" | "away" | "offline";
	/**
	 * The last seen information is only available when the user has no valid DeviceRecords. If the object was removed from the cache, its data might not be returned, because there is no persistent store.
	 */
	lastSeen: LastSeenRecord;
}
/**
 * The personal profile settings for a user.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-profile
 */
export interface Profile {
	/**
	 * 	Name for displaying in apps. This could be the user's "real name" or their gamertag, depending on privacy. This setting represents the user's identity string that should be used for display in apps.
	 */
	AppDisplayName: string;
	/**
	 * 	Name for displaying in games. This could be the user's "real name" or their gamertag, depending on privacy. This setting represents the user's identity string that should be used for display in games.
	 */
	GameDisplayName: string;
	/**
	 * The user's gamertag.
	 */
	Gamertag: string;
	/**
	 * Raw app display pic URL.
	 */
	AppDisplayPicRaw: string;
	/**
	 * Raw game display pic URL.
	 */
	GameDisplayPicRaw: string;
	/**
	 * What type of account does the user have? Gold, Silver, or FamilyGold?
	 */
	AccountTier: string;
	/**
	 * How many years has the user been with Xbox Live?
	 */
	TenureLevel: number;
	/**
	 * Gamerscore of the user.
	 */
	Gamerscore: number;
}
/**
 * Contains property data provided by the client for matchmaking request criteria.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-property
 */
export interface Property {
	/**
	 * An id for this property.
	 */
	id: string;
	/**
	 * Type of the property. Supported values are:
	 * 0 = integer,
	 * 1 = string
	 */
	type: number;
	/**
	 * Value of this property.
	 */
	value: number | string;
}
/**
 * Wraps the list of return game clips along with paging information for the list.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-queryclipsresponse
 */
export interface QueryClipsResponse {
	/**
	 * An array of game clips that satisfied the query up to the request limit (maxItems).
	 */
	gameClips: GameClip[];
	/**
	 * Contains the information needed for continuation and paging for subsequent calls for lists that exceed the request limit (maxItems).
	 */
	pagingInfo: PagingInfo;
}
/**
 * Contains quota information about a title group.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-quota
 */
export interface QuotaInfo {
	quotaInfo: {
		/**
		 * Maximum number of bytes usable by the title.
		 */
		usedBytes: number;
		/**
		 * Number of bytes used by the title.
		 */
		quotaBytes: number;
	};
}
/**
 * Contains the new base Reputation scores to which a user's existing scores should be changed.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-resetreputation
 */
export interface ResetReputation {
	/**
	 * The desired new base Fairplay Reputation score for the user (valid range 0 to 75).
	 */
	fairplayReputation: number;
	/**
	 * The desired new base Comms Reputation score for the user (valid range 0 to 75).
	 */
	commsReputation: number;
	/**
	 * The desired new base UserContent Reputation score for the user (valid range 0 to 75).
	 */
	userContentReputation: number;
}
/**
 * Contains information about an error returned when a call to the service failed.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-serviceerror
 */
export interface ServiceError {
	/**
	 * The type of error.
	 */
	code: 0 | 4000 | 4100 | 4500 | 5000 | 5300;
	/**
	 * 	The name of the service that raised the error. For example, a value of ReputationFD indicates that the error was in the reputation service.
	 */
	source: string;
	/**
	 * A description of the error.
	 */
	description: string;
}
export interface ServiceErrorCodes {
	0: "Success No error";
	4000: "Invalid Request Body The JSON document submitted with a POST request failed validation. See the description field for details.";
	4100: "User Does Not Exist The XUID contained in the request URI does not represent a valid user on XBOX Live.";
	4500: "Authorization Error The caller is not authorized to perform the requested operation.";
	5000: "Service Error There was an internal error in the service.";
	5300: "Service Unavailable The service is unavailable.";
}
/**
 * When a service error is encountered, an appropriate HTTP error code will be returned. Optionally, the service may also include a ServiceErrorResponse object as defined below. In production environments, less data may be included.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-serviceerrorresponse
 */
export interface ServiceErrorResponse {
	/**
	 * Code associated with the error (can be null).
	 */
	errorCode: number | null;
	/**
	 * Additional details about the error.
	 */
	errorMessage: string;
}
/**
 * Contains data for a fitness session.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-sessionentry
 */
export interface SessionEntry {
	/**
	 * Duration—in seconds—of the session.
	 */
	durationInSeconds: number;
	/**
	 * Energy—in joules—burned in the session.
	 */
	joules: number;
	/**
	 * Average met value over the session duration. The MET value is the ratio of an individual's metabolic rate during an activity relative to the individual's metabolic rate at rest. Because the metabolic rate for resting is 1.0 regardless of an individual's weight, and MET values are relative to an individual's resting metabolic rate, they can be used to compare the intensity of an activity being performed by individuals of different weights.
	 */
	met: number;
	/**
	 * Time—based on UTC—entry was entered on server.
	 */
	serverTimestamp: DateTime;
	/**
	 * Session source.
	 */
	source: `${number}`;
	/**
	 * Time—based on Coordinated Universal Time (UTC)—entry was created on the client.
	 */
	timestamp: DateTime;
	/**
	 * Title—in decimal—that created the entry.
	 */
	titleId: number;
}
/**
 * Contains information about a title from storage.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-titleblob
 */
export interface TitleBlob {
	/**
	 * Date and time of the last upload of the file.
	 */
	clientFileTime?: DateTime;
	/**
	 * Name of the file that is shown to the user.
	 */
	displayName?: string;
	/**
	 * Tag for the file used in download and upload requests.
	 */
	etag: string;
	/**
	 * Name of the file.
	 */
	fileName: string;
	/**
	 * Size of the file in bytes.
	 */
	size: number;
	/**
	 * Type of data. Possible values are: config, json, binary.
	 */
	smartBlobType?: string;
}
/**
 * Request for information about a title.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-titlerequest
 */
export interface TitleRequest {
	/**
	 * Identifier of the title.
	 */
	id: `${number}`;
	/**
	 * In-title information, including rich presence and media information, if available.
	 */
	activity: ActivityRequest;
	/**
	 * 	Whether a user is active or not. This field is required to mark a user as inactive. The default is "active".
	 */
	state: string;
	/**
	 * 	The placement mode of the title. Possible values include "full", "fill", "snapped", or "background". The default is "full".
	 */
	placement: "full" | "fill" | "snapped" | "background";
}
/**
 * Contains user leaderboard data.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-user
 */
export interface User {
	/**
	 * Gamertag of the player (maximum of 15 characters). The client should use this value in the UI when identifying the player.
	 */
	gamertag: string;
	/**
	 * The rank of the user relative to the user requesting the leaderboard data.
	 */
	rank: number;
	/**
	 * The user's rating.
	 */
	rating: string;

	xuid: number;
}
/**
 * The Xbox User ID (XUID) of the user.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-userclaims
 */
export interface UserClaims {
	/**
	 * The Xbox User ID (XUID) of the user.
	 */
	xuid: number;
	/**
	 * gamertag of the user.
	 */
	gamertag: string;
}

/**
 * A collection of User objects.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-userlist
 */
export interface UserList {
	users: User[];
}
/**
 * Returns settings for current authenticated user.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-usersettings
 */
export interface UserSettings {
	/**
	 * The identifier of the setting.
	 */
	id: number;
	/**
	 * Represents the source of the setting.
	 */
	source: number;
	/**
	 * The identifier of the title associated with the setting.
	 */
	titleId: number;
	/**
	 * Represents the value of the setting. Clients retrieving settings must understand the representation format to be able to read the data.
	 */
	value: Int8Array;
}
/**
 * Contains user title data.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-usertitlev2
 */
export interface UserTitle {
	/**
	 * The time an achievement was last earned.
	 */
	lastUnlock: DateTime;
	/**
	 * The unique identifier for the title.
	 */
	titleId: number;
	/**
	 * The version of the title.
	 */
	titleVersion: string;
	/**
	 * 	ID of the primary service config set associated with the title.
	 */
	serviceConfigId: string;

	titleType: string;
	/**
	 * The supported platform.
	 */
	platform: string;
	/**
	 * The text name of this title. Maximum length 22.
	 */
	name: string;
	/**
	 * The number of achievements earned for the title, including unlocked achievements and successfully completed challenges.
	 */
	earnedAchievements: number;
	/**
	 * The total gamerscore this user has earned in this title.
	 */
	currentGamerscore: number;
	/**
	 * The total possible gamerscore for this title.
	 */
	maxGamerscore: number;
}
/**
 * Result codes corresponding to each string submitted to /system/strings/validate.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-verifystringresult
 */
export interface VerifyStringResult {
	verifyStringResult: { resultCode: `${number}`; offendingString: string }[];
}

const VerifyStringResultCodes = {
	0: "Success",
	1: "Offensive string",
	2: "String too long",
	3: "Unknown error",
};
/**
 * List of XUIDs on which to perform an operation.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-xuidlist
 */
export interface XuidList {
	/**
	 * List of Xbox User ID (XUID) values on which an operation should be performed or data should be returned.
	 */
	xuids: string[];
}

/**
 * The request JSON object passed for an operation on a MultiplayerSession object.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-multiplayersessionrequest
 */
export interface MultiplayerSessionRequest {
	/**
	 * Read-only settings that are merged with the session template to produce the constants for the session.
	 */
	constants: {
		[key: string]: any;
	};
	/**
	 * Changes to be merged into the session properties.
	 */
	properties: {
		[key: string]: any;
	};
	members: {
		/**
		 * Requires a service principal. Existing members can be deleted by index.
		 * Not available on large sessions.
		 */
		"5": null;

		/**
		 * Reservation requests must start with zero. New users will get added in order to the end of the session's member list.
		 * Large sessions don't support reservations.
		 */
		[key: `reserve_${number}`]: {
			constants: {
				[key: string]: any;
			};
		};

		/**
		 * Constants and properties that work much like their top-level counterparts. Any PUT method requires the user to be a member of the session, and adds the user if necessary. If "me" is specified as null, the member making the request is removed from the session.
		 * Requires a user principal with a xuid claim. Can be 'null' to remove myself from the session.
		 */
		me: {
			constants: {
				[key: string]: any;
			};
			properties: {
				[key: string]: any;
			};
		} | null;
	};

	/**
	 * Values indicating updates and additions to the session's set of associated server participants. If a server is specified as null, that server entry is removed from the session.
	 * Requires a server principal.
	 */
	servers: {
		/**
		 *  Can be any name. The value can be 'null' to remove the server from the session.
		 */
		[key: string]: {
			constants: {
				[key: string]: any;
			};
			properties: {
				[key: string]: any;
			};
		} | null;
	};
}
export interface MultiplayerSession {
	properties: {
		system: {
			turn: [];
			[key: string]: any;
		};
		custom: {
			[key: string]: any;
		};
	};
	constants: {
		system: {
			visibility: string;
			[key: string]: any;
		};
		custom: { [key: string]: any };
	};
	servers: {};
	members: {
		first: number;
		end: number;
		count: number;
		accepted: number;
		[key: `${number}`]: {
			next: 1;
			pending: true;
			properties: {
				system: { [key: string]: any };
				custom: { [key: string]: any };
			};
			constants: {
				system: {
					xuid: string;
				};
				custom: {
					[key: string]: any;
				};
			};
		};
	};
	key: string;
}
/**
 * A JSON object representing the Microsoft.Xbox.Services.Multiplayer.MultiplayerActivityDetails.
 * @note This object is implemented by the 2015 Multiplayer and applies only to that multiplayer version and later. It is intended for use with template contract 104/105 or later.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-multiplayersessionreference
 */
export interface MultiplayerActivityDetails {
	id: string;
	type: "activity";
	version: 1;
	sessionRef: MultiplayerSessionReference;
	/**
	 * 	The title ID that should be launched in order to join the activity.
	 */
	titleId: string;
	/**
	 * Xbox user ID of the member who owns the activity.
	 */
	ownerXuid: string;
	/**
	 * The handle ID corresponding to the activity.
	 */
	handleID: string;
	/**
	 * Only if ?include=relatedInfo
	 */
	relatedInfo?: {
		/**
		 * 	A Microsoft.Xbox.Services.Multiplayer.MultiplayerSessionVisibility value indicating the visibility state of the session.
		 */
		visibility: string | "open";
		/**
		 * A Microsoft.Xbox.Services.Multiplayer.MultiplayerSessionJoinRestriction value indicating the join restriction for the session. This restriction applies if the visiblity field is set to "open".
		 */
		joinRestriction: string | "followed";
		/**
		 * True if the session is temporarily closed for joining, and false otherwise.
		 */
		closed: boolean;
		/**
		 * Number of total slots.
		 */
		maxMembersCount: number;
		/**
		 * Number of slots occupied.
		 */
		membersCount: number;
	};
}
/**
 * A Microsoft.Xbox.Services.Multiplayer.MultiplayerSessionReference object representing identifying information for the session.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-multiplayersessionrequest
 */
export interface MultiplayerSessionReference {
	/**
	 * Service configuration identifier (SCID). Part 1 of the session identifier.
	 *  @type {GUID}
	 */
	scid: string;
	/**
	 * Name of the current instance of the session template. Part 2 of the session identifier.
	 */
	templateName: string;
	/**
	 * Name of the session. Part 3 of the session identifier.
	 * The session name is optional in a POST; if not specified, MPSD fills in a GUID.
	 */
	name: string;
}

export interface InviteAttributes {
	/**
	 * The title being invited to, in decimal uint32. This value is used to find the title name and/or image.
	 */
	titleId: string;
	/**
	 * The title defined context token. Must be 256 characters or less when URI-encoded.
	 */
	context: string;
	/**
	 * The string name of a custom invite string to display in the invite notification.
	 * */
	contextString: string;
	/**
	 * The string name of the sender when the sender is a service.
	 */
	senderString: string;
}

export interface InviteHandleRequest {
	id: string;
	version: number | 1;
	type: "invite";
	sessionRef: MultiplayerSessionReference;
	inviteAttributes: InviteAttributes;
	invitedXuid: string;
}

export interface HandleRequest {
	version: 1;
	type: "activity";
	sessionRef: MultiplayerSessionReference;
}
/**
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-multiplayersession
 */
export interface MultiplayerSession {
	properties: {
		system: {
			turn: [];
			[key: string]: any;
		};
		custom: {
			[key: string]: any;
		};
	};
	constants: {
		system: {
			visibility: string;
			[key: string]: any;
		};
		custom: { [key: string]: any };
	};
	servers: {};
	members: {
		first: number;
		end: number;
		count: number;
		accepted: number;
		[key: `${number}`]: {
			next: 1;
			pending: true;
			properties: {
				system: { [key: string]: any };
				custom: { [key: string]: any };
			};
			constants: {
				system: {
					xuid: string;
				};
				custom: {
					[key: string]: any;
				};
			};
		};
	};
	key: string;
}

export interface SessionQueries {
	/**
	 * A keyword, for example, "foo", that must be found in sessions or templates if they are to be retrieved.
	 */
	keyword: string;
	/**
	 * The Xbox user ID, for example, "123", for sessions to include in the query. By default, the user must be active in the session for it to be included.
	 */
	xuid: string;
	/**
	 * 	True to include sessions for which the user is set as a reserved player but has not joined to become an active player. This parameter is only used when querying your own sessions, or when querying a specific user's sessions server-to-server.
	 */
	reservations: boolean;
	/**
	 *	True to include sessions that the user has accepted but is not actively playing. Sessions in which the user is "ready" but not "active" count as inactive.
	 */
	inactive: boolean;
	/**
	 * 	True to include private sessions. This parameter is only used when querying your own sessions, or when querying a specific user's sessions server-to-server.
	 */
	private: boolean;
	/**
	 * Visibility state for the sessions. Possible values are defined by the MultiplayerSessionVisibility. If this parameter is set to "open", the query should include only open sessions. If it is set to "private", the private parameter must be set to true.
	 */
	visibility: string;
	/**
	 * The maximum session version that should be included. For example, a value of 2 specifies that only sessions with a major session version of 2 or less should be included. The version number must be less than or equal to the request's contract version mod 100.
	 */
	version: number;
	/**
	 * The maximum number of sessions to retrieve. This number must be between 0 and 100.
	 */
	take: number;
}
/**
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-peoplelist
 */
export interface PeopleList {
	people: Person[];
	/**
	 * Total number of Person objects available in the set. This value can be used by clients for paging because it represents the size of the whole set, not just the most recent response. Example value: 680.
	 */
	totalCount: number;
}

/**
 * Metadata about a single Person in the People system.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-person
 */
export interface Person {
	/**
	 * Xbox User ID (XUID) in decimal form.
	 * @example "2603643534573573"
	 */
	xuid: string;
	/**
	 * Whether this person is one that the user cares about more. Because users can have a very large number of people in their People list, favorite people should be prioritized in experiences and shown before others that are not favorites.
	 */
	isFavorite: boolean;
	/**
	 * Whether this person is following the user on whose behalf the API call was made.
	 */
	isFollowingCaller?: boolean;
	/**
	 * Within which external networks the user and this person have a relationship.
	 */
	socialNetworks?: string[];
}
/**
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/json/json-personsummary
 */
export interface PersonSummary {
	targetFollowingCount: number;

	targetFollowerCount: number;
	/**
	 * Whether the caller is following the target. Example values: true
	 */
	isCallerFollowingTarget: boolean;
	isTargetFollowingCaller: boolean;
	/**
	 * Whether the caller has marked the target as a favorite. Example values: true
	 */
	hasCallerMarkedTargetAsFavorite: boolean;
	/**
	 * Whether the caller has marked the target as known. Example values: true
	 */
	hasCallerMarkedTargetAsKnown: boolean;
	/**
	 * Legacy friend status of the target as seen by the caller. Can be "None", "MutuallyAccepted", "OutgoingRequest", or "IncomingRequest". Example values: "MutuallyAccepted"s
	 */
	legacyFriendStatus:
		| "None"
		| "MutuallyAccepted"
		| "OutgoingRequest"
		| "IncomingRequest";
	recentChangeCount: number;
	/**
	 * Recent change watermark for the target. This value will only exist when a user is viewing their own summary. Example values: 5
	 */
	watermark: string;
}

enum ErrorCodes {
	E_GAMERUNTIME_NOT_INITIALIZED = 0x89240100,
	E_GAMERUNTIME_DLL_NOT_FOUND = 0x89240101,
	E_GAMERUNTIME_VERSION_MISMATCH = 0x89240102,
	E_GAMERUNTIME_WINDOW_NOT_FOREGROUND = 0x89240103,
	E_GAMERUNTIME_SUSPENDED = 0x89240104,
}

type ClientTypes =
	| "App"
	| "C13"
	| "CommercialService"
	| "Companion"
	| "Console"
	| "Editorial"
	| "1stPartyApp"
	| "MoLive"
	| "PhoneROM" /**(Windows Phone 7)*/
	| "RecommendationService"
	| "SAS"
	| "SDS"
	| "SubscriptionService"
	| "X8"
	| "X13"
	| "Webblend"
	| "XboxCom";
type DeviceType =
	| "Xbox360"
	| "XboxDurango"
	| "Xbox"
	| "iOS"
	| "iPhone"
	| "iPad"
	| "Android"
	| "AndroidPhone"
	| "AndroidSlate"
	| "WindowsPC"
	| "WindowsPhone"
	| "Service"
	| "Web";

type GameType =
	| "Xbox360Game"
	| "XboxGameTrial"
	| "Xbox360GameContent"
	| "Xbox360GameDemo"
	| "XboxTheme"
	| "XboxOriginalGame"
	| "XboxGamerTile"
	| "XboxArcadeGame"
	| "XboxGameConsumable"
	| "XboxGameVideo"
	| "XboxGameTrailer"
	| "XboxBundle"
	| "XboxXnaCommunityGame"
	| "XboxMarketplace"
	| "AvatarItem"
	| "MobileGame"
	| "XboxMobilePDLC"
	| "XboxMobileConsumable"
	| "WebGame"
	| "MetroGame"
	| "MetroGameContent"
	| "MetroGameConsumable"
	| "DGame"
	| "DGameDemo"
	| "DConsumable"
	| "DDurable";

type AppType = "XboxApp" | "DApp";
type MovieType = "Movie";
type TVType =
	| "TVShow" /*(one-off TV shows)*/
	| "TVEpisode"
	| "TVSeries"
	| "TVSeason";

type MusicType = "Album" | "Track" | "MusicVideo";
type MusicArtistType = "MusicArtist";

type WebVideoType = "WebVideo" | "WebVideoCollection";
type EnhancedContentType =
	| "GameLayer"
	| "GameActivity"
	| "AppActivity"
	| "VideoLayer"
	| "VideoActivity"
	| "DActivity"
	| "DNativeApp";

/**
 * The following table lists the standard HTTP header used in Xbox Live Services responses.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/additional/httpstandardheaders
 */
export interface ResponseHeaders {
	/**
	 * Specifies the type of content being returned.
	 */
	"Content-Type": "application/json" | "application/xml";
	/**
	 * Specifies the length of the data being returned.
	 */
	"Content-Length": number;
}
/**
 * The following table lists the standard HTTP headers used when making Xbox Live Services requests.
 * @url https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/reference/live/rest/additional/httpstandardheaders
 */
export interface RequestHeaders {
	/**
	 * API contract version. Required on all Xbox Live Services requests.
	 */
	"x-xbl-contract-version": number;
	/**
	 * STS authentication token. The value for this header is retrieved from the GetTokenAndSignatureResult.Token property.
	 */
	Authorization: string;
	"Content-Type":
		| "application/xml"
		| "application/json"
		| "multipart/form-data"
		| "application/x-www-form-urlencoded";
	/**
	 * 	Specifies the length of the data being submitted in a POST request.
	 */
	"Content-Length": number;
	/**
	 * Specifies how to localize any strings returned. See Advanced Xbox 360 Programming for a list of valid language/locale combinations.
	 * @url https://msdn.microsoft.com/en-us/library/bb975829.aspx
	 */

	"Accept-Language": string;
}
