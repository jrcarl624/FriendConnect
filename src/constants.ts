export default new (class {
	AUTH_TITLE = "00000000441cc96b"; // Minecraft for Nintendo Switch
	SCOPE = "service::user.auth.xboxlive.com::MBI_SSL";
	RELAYING_PARTY = "http://xboxlive.com";

	SERVICE_CONFIG_ID = "4fc10100-5f7a-4470-899b-280835760c07"; // The service config ID for Minecraft
	CREATE_SESSION =
		"https://sessiondirectory.xboxlive.com/serviceconfigs/" +
		this.SERVICE_CONFIG_ID +
		"/sessionTemplates/MinecraftLobby/sessions/";

	LIVE_DEVICE_CODE_REQUEST = "https://login.live.com/oauth20_connect.srf";
	LIVE_TOKEN_REQUEST = "https://login.live.com/oauth20_token.srf";
	USER_AUTHENTICATE_REQUEST =
		"https://user.auth.xboxlive.com/user/authenticate";
	DEVICE_AUTHENTICATE_REQUEST =
		"https://device.auth.xboxlive.com/device/authenticate";
	TITLE_AUTHENTICATE_REQUEST =
		"https://title.auth.xboxlive.com/title/authenticate";
	XSTS_AUTHENTICATE_REQUEST = "https://xsts.auth.xboxlive.com/xsts/authorize";

	RTA_WEBSOCKET = "wss://rta.xboxlive.com/connect";
	CREATE_HANDLE = "https://sessiondirectory.xboxlive.com/handles";

	PEOPLE = "https://social.xboxlive.com/users/me/people";

	PEOPLE_HUB = "https://peoplehub.xboxlive.com/users/me/people";
})();
