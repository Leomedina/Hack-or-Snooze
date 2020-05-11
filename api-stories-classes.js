const BASE_URL = 'https://hack-or-snooze-v3.herokuapp.com';

/**
 * This class maintains the list of individual Story instances
 *  It also has some methods for fetching, adding, and removing stories
 */

class StoryList {
	constructor(stories) {
		this.stories = stories;
	}
	/**
	 * This method is designed to be called to generate a new StoryList.
	 *  It:
	 *  - calls the API
	 *  - builds an array of Story instances
	 *  - makes a single StoryList instance out of that
	 *  - returns the StoryList instance.*
	 */
	// Since static methods are called on the class directly and NOT the instance, they don't have
	// access to the data stored within the instance.
	// getStories is a method that calls a GET request for all of the stories stored on the server
	// and does not require authentication therefore it doesn't need any data stored within the instance.
	// So it doesn't make sense to give it access to the data, since it's not going to need it.

	static async getStories() {
		// query the /stories endpoint (no auth required)
		const response = await axios.get(`${BASE_URL}/stories`);

		// turn the plain old story objects from the API into instances of the Story class
		const stories = response.data.stories.map((story) => new Story(story));

		// build an instance of our own class using the new array of stories
		const storyList = new StoryList(stories);
		return storyList;
	}

	/**
	 * Method to make a POST request to /stories and add the new story to the list
	 * - user - the current instance of User who will post the story
	 * - newStory - a new story object for the API with title, author, and url
	 *
	 * Returns the new story object
	 */

	async addStory(user, newStory) {
		const response = await axios
			.post(`${BASE_URL}/stories`, {
				token: user.login,
				story: newStory,
			})
			.catch(function (error) {
				if (error.response) {
					// Catches request made and server responded
					console.log(error.response.data);
					console.log(error.response.status);
					console.log(error.response.headers);
				} else {
					// Catches remaining errors
					console.log('Error', error.message);
				}
			});
		newStory = new Story(response.data.story);
		//set story to the beginning of this instance's stories and the user's own stories array.
		this.stories.unshift(newStory);
		user.ownStories.unshift(newStory);

		return newStory;
	}
}
/**
 * Story class to represent a single story.
 * The constructor is designed to take an object for better readability / flexibility
 * - storyObj: an object that has story properties in it
 */
class Story {

	constructor(storyObj) {
		this.author = storyObj.author;
		this.title = storyObj.title;
		this.url = storyObj.url;
		this.username = storyObj.username;
		this.storyId = storyObj.storyId;
		this.createdAt = storyObj.createdAt;
		this.updatedAt = storyObj.updatedAt;
	}
}