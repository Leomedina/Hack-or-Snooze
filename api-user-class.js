/**
 * The User class to primarily represent the current user.
 *  There are helper methods to signup (create), login, and getLoggedInUser
 */

class User {
	constructor(userObj) {
		this.username = userObj.username;
		this.name = userObj.name;
		this.createdAt = userObj.createdAt;
		this.updatedAt = userObj.updatedAt;

		// these are all set to defaults, not passed in by the constructor
		this.loginToken = '';
		this.favorites = [];
		this.ownStories = [];
	}

	/* Create and return a new user.
	 *
	 * Makes POST request to API and returns newly-created user.
	 *
	 * - username: a new username
	 * - password: a new password
	 * - name: the user's full name
	 */

	static async create(username, password, name) {
		const response = await axios.post(`${BASE_URL}/signup`, {
			user: {
				username,
				password,
				name,
			},
		});

		// build a new User instance from the API response
		const newUser = new User(response.data.user);

		// attach the token to the newUser instance for convenience
		newUser.loginToken = response.data.token;

		return newUser;
	}

	/* Login in user and return user instance.

   * - username: an existing user's username
   * - password: an existing user's password
   */

	static async login(username, password) {
		const response = await axios.post(`${BASE_URL}/login`, {
			user: {
				username,
				password,
			},
		});

		// build a new User instance from the API response
		const existingUser = new User(response.data.user);

		// instantiate Story instances for the user's favorites and ownStories
		existingUser.favorites = response.data.user.favorites.map((s) => new Story(s));
		existingUser.ownStories = response.data.user.stories.map((s) => new Story(s));

		// attach the token to the newUser instance for convenience
		existingUser.loginToken = response.data.token;

		return existingUser;
	}

	/** Get user instance for the logged-in-user.
	 *
	 * This function uses the token & username to make an API request to get details
	 *   about the user. Then it creates an instance of user with that info.
	 */

	static async getLoggedInUser(token, username) {
		// if we don't have user info, return null
		if (!token || !username) return null;

		// call the API
		const response = await axios.get(`${BASE_URL}/users/${username}`, {
			params: {
				token,
			},
		});

		// instantiate the user from the API information
		const existingUser = new User(response.data.user);

		// attach the token to the newUser instance for convenience
		existingUser.loginToken = token;

		// instantiate Story instances for the user's favorites and ownStories
		existingUser.favorites = response.data.user.favorites.map((s) => new Story(s));
		existingUser.ownStories = response.data.user.stories.map((s) => new Story(s));
		return existingUser;
	}

	async getUserData() {
		const response = await axios.get(`${BASE_URL}/users/${this.username}`, {
			params: {
				token: this.loginToken,
			},
		});
		this.name = response.data.user.name;
		this.createdAt = response.data.user.createdAt;
		this.updatedAt = response.data.user.updatedAt;
		this.favorites = response.data.user.favorites.map((story) => new Story(story));
		this.ownStories = response.data.user.stories.map((story) => new Story(story));

		return this;
	}

	async addFavorite(storyId) {
		const response = await axios.post(`${BASE_URL}/users/${this.username}/favorites/${storyId}`, {
			token: this.loginToken,
		});

		//Reload User Data
		await this.getUserData();
		return this;
	}

	async removeFavorite(storyId) {
		const response = await axios.delete(`${BASE_URL}/users/${this.username}/favorites/${storyId}`, {
			params: {
				token: this.loginToken,
			},
		});
		//Reload User Data
		await this.getUserData();
		return this;
	}
}
