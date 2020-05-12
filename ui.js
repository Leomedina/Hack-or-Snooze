$(async function () {
	// cache some selectors we'll be using quite a bit
	const $body = $('body');
	const $allStoriesList = $('#all-articles-list');
	const $submitForm = $('#submit-form');
	const $favoritedStories = $('#favorited-articles');
	const $filteredArticles = $('#filtered-articles');
	const $loginForm = $('#login-form');
	const $createAccountForm = $('#create-account-form');
	const $ownStories = $('#my-articles');
	const $navLogin = $('#nav-login');
	const $navWelcome = $('#nav-welcome');
	const $navUserProfile = $('#nav-user-profile');
	const $navSubmit = $('#nav-submit');
	const $navLogOut = $('#nav-logout');
	const $userProfile = $('#user-profile');
	const $myStories = $('#nav-my-stories');
	const $myFaves = $('#nav-favorites');

	const articlesContainer = document.querySelector('.articles-container');

	// global storyList variable
	let storyList = null;

	// global currentUser variable
	let currentUser = null;

	await checkIfLoggedIn();

	/**
	 *  Following Tasks are Event Handlers for the forms:
	 *  1. Login Form
	 *  2. Sign-up Form
	 *  3. Log Out Button
	 *  4. submission form
	 * */

	/**
	 * Event listener for logging in.
	 *  If successfully we will setup the user instance
	 */

	$loginForm.on('submit', async function (evt) {
		evt.preventDefault(); // no page-refresh on submit

		// grab the username and password
		const username = $('#login-username').val();
		const password = $('#login-password').val();

		// call the login static method to build a user instance
		const userInstance = await User.login(username, password);
		// set the global user to the user instance
		currentUser = userInstance;
		syncCurrentUserToLocalStorage();
		loginAndSubmitForm();
	});

	/**
	 * Event listener for signing up.
	 *  If successfully we will setup a new user instance
	 */

	$createAccountForm.on('submit', async function (evt) {
		evt.preventDefault(); // no page refresh

		// grab the required fields
		let name = $('#create-account-name').val();
		let username = $('#create-account-username').val();
		let password = $('#create-account-password').val();

		// call the create method, which calls the API and then builds a new user instance
		const newUser = await User.create(username, password, name);
		currentUser = newUser;
		syncCurrentUserToLocalStorage();
		loginAndSubmitForm();
	});

	/**
	 * Log Out Functionality
	 */

	$navLogOut.on('click', function () {
		// empty out local storage
		localStorage.clear();
		// refresh the page, clearing memory
		location.reload();
	});

	$submitForm.on('submit', async function (evt) {
		evt.preventDefault();

		// grab all the info from the form
		const title = $('#title').val();
		const url = $('#url').val();
		const hostName = getHostName(url);
		const author = $('#author').val();
		const username = currentUser.username;

		const storyObject = await storyList.addStory(currentUser, {
			title,
			author,
			url,
			username,
		});

		// generate markup for the new story
		const $li = $(`
      <li id="${storyObject.storyId}" class="id-${storyObject.storyId}">
        <span class="star">
          <i class="far fa-star"></i>
        </span>
        <a class="article-link" href="${url}" target="a_blank">
          <strong>${title}</strong>
        </a>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-author">by ${author}</small>
        <small class="article-username">posted by ${username}</small>
      </li>
    `);
		$allStoriesList.prepend($li);

		// hide the form and reset it
		$submitForm.slideUp('slow');
		$submitForm.trigger('reset');
	});

	/**
	 * Following Tasks are Navigation Event Handlers:
	 *  1. Nav-Login Button
	 *  2. Event Handler for home page
	 *  3. Event handler for clicking on profile
	 *  4. Event handler for nav submit, shows form
	 *  5. Event handler for removing own stories
	 *  6. Event handler for add to favorites / remove from favorites
	 */

	/**
	 * Event Handler for Clicking Login
	 */

	$navLogin.on('click', function () {
		// Show the Login and Create Account Forms
		$loginForm.slideToggle();
		$createAccountForm.slideToggle();
		$allStoriesList.toggle();
	});

	/**
	 * Event handler for Navigation to Homepage
	 */

	$body.on('click', '#nav-all', async function () {
		hideElements();
		await generateStories();
		$allStoriesList.show();
	});

	// Event handler for user profile, hides everything except profile
	$navUserProfile.on('click', function () {
		hideElements();
		$userProfile.show();
	});

	$navSubmit.on('click', function () {
		if (currentUser) {
			hideElements();
			$allStoriesList.show();
			$submitForm.slideToggle();
		}
	});
	
	$myFaves.on('click', function () {
		hideElements();
		if (currentUser) {
			generateFaves();
			$favoritedStories.show();
		}
	});

	$myStories.on('click', function () {
		hideElements();
		if (currentUser) {
			$userProfile.hide();
			generateMyStories();
			$ownStories.show();
		}
	});

	$ownStories.on('click', '.trash-can', async function (evt) {
		// get the Story's ID
		const $closestLi = $(evt.target).closest('li');
		const storyId = $closestLi.attr('id');

		// remove the story from the API
		await storyList.removeStory(currentUser, storyId);

		// re-generate the story list
		await generateStories();

		// hide everything
		hideElements();

		// ...except the story list
		$allStoriesList.show();
	});

	//TOGGLE OFF AND ON FAVORITES

	articlesContainer.addEventListener('click', async function (event) {
		target = event.target;
		storyId = event.target.parentNode.getAttribute('id');
		console.log(storyId);

		if (event.target.tagName === 'I') {
			if (target.classList.contains('fas')) {
				target.classList.replace('fas', 'far');
				await currentUser.removeFavorite(storyId);
			} else if (target.classList.contains('far')) {
				await currentUser.addFavorite(storyId);
				target.classList.add('fas');
			}
		}
	});
	/**
	 * The Following are functions for the above tasks
	 * 	1. CheckIfLoggedIn()
	 * 		- Used at the beginning of script
	 * 2. LoginAndSubmissionForm()
	 * 		- Used in Event Listener for sign-up/login
	 * 3. GenerateProfile()
	 * 		- used to populate the profile
	 * 		-used in login/signup
	 * 4. GeneratedStories()
	 * 		- Used in Event Handler for homepage
	 * 5. generateStoryHTML()
	 * 		- Used to help generate stories
	 * 6. isFavorite()
	 * 		- checks if story is favorited
	 * 		- used in generateStoryHTML()
	 * 7. hide Elements ()
	 * 		- Used in homepage Nav
	 * 8. Nav for Logged-in Users
	 * 		- display logged in nav
	 * 		- Used in check if logged in and func to login and submit
	 * 9. Get Host name()
	 * 		- used in generateStoryHTML() to get host name of link
	 * 10. SyncCurrentUsertoLocaStorage()
	 * 		- used in sign-up/login event handlers
	 * 11. Generate all my stories
	 * 		-used in event handler for my stories
	 * 12. Generate all my favorites
	 * 		-used in event handler for my faves
	 */

	/**
	 * On page load, checks local storage to see if the user is already logged in.
	 * Renders page information accordingly.
	 */

	async function checkIfLoggedIn() {
		// let's see if we're logged in
		const token = localStorage.getItem('token');
		const username = localStorage.getItem('username');

		// if there is a token in localStorage, call User.getLoggedInUser
		//  to get an instance of User with the right details
		//  this is designed to run once, on page load
		currentUser = await User.getLoggedInUser(token, username);
		await generateStories();

		if (currentUser) {
			generateProfile();
			showNavForLoggedInUser();
		}
	}

	/**
	 * A rendering function to run to reset the forms and hide the login info
	 */

	function loginAndSubmitForm() {
		// hide the forms for logging in and signing up
		$loginForm.hide();
		$createAccountForm.hide();

		// reset those forms
		$loginForm.trigger('reset');
		$createAccountForm.trigger('reset');

		// show the stories
		$allStoriesList.show();

		// update the navigation bar and generate profile
		generateProfile();
		showNavForLoggedInUser();
	}

	function generateProfile() {
		$('#profile-name').text(`Name: ${currentUser.name}`);
		$('#profile-username').text(`User: ${currentUser.username}`);
		$('#profile-account-date').text(`User: ${currentUser.createdAt}`);
		$navUserProfile.text(`${currentUser.username}`);
	}

	/**
	 * A rendering function to call the StoryList.getStories static method,
	 *  which will generate a storyListInstance. Then render it.
	 */

	async function generateStories() {
		// get an instance of StoryList
		const storyListInstance = await StoryList.getStories();
		// update our global variable
		storyList = storyListInstance;
		// empty out that part of the page
		$allStoriesList.empty();

		// loop through all of our stories and generate HTML for them
		for (let story of storyList.stories) {
			const result = generateStoryHTML(story);
			$allStoriesList.append(result);
		}
	}

	/**
	 * A function to render HTML for an individual Story instance
	 */

	function generateStoryHTML(story, isOwnStory) {
		let hostName = getHostName(story.url);
		let starType = isFavorite(story) ? 'fas' : 'far';

		//render a trash can for deleting your own story
		const trashIcon = isOwnStory
			? `<span class="trash-can">
          <i class="fas fa-trash-alt"></i>
        </span>`
			: '';

		// render story markup
		const storyMarkup = $(`
      <li id="${story.storyId}">${trashIcon}<i class="${starType} fa-star"></i>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

		return storyMarkup;
	}

	function isFavorite(story) {
		let favStoryIds = new Set();
		if (currentUser) {
			favStoryIds = new Set(currentUser.favorites.map((obj) => obj.storyId));
		}
		return favStoryIds.has(story.storyId);
	}

	/* hide all elements in elementsArr */

	function hideElements() {
		const elementsArr = [
			$submitForm,
			$allStoriesList,
			$filteredArticles,
			$ownStories,
			$userProfile,
			$favoritedStories,
			$loginForm,
			$createAccountForm,
			$userProfile,
		];

		elementsArr.forEach(($elem) => $elem.hide());
	}

	function showNavForLoggedInUser() {
		$navLogin.hide();
		$navLogOut.show();
		$('.main-nav-links, #user-profile').toggleClass('hidden');
		$navWelcome.show();
		$navLogOut.show();
	}

	/* simple function to pull the hostname from a URL */

	function getHostName(url) {
		let hostName;
		if (url.indexOf('://') > -1) {
			hostName = url.split('/')[2];
		} else {
			hostName = url.split('/')[0];
		}
		if (hostName.slice(0, 4) === 'www.') {
			hostName = hostName.slice(4);
		}
		return hostName;
	}

	/* sync current user information to localStorage */

	function syncCurrentUserToLocalStorage() {
		if (currentUser) {
			localStorage.setItem('token', currentUser.loginToken);
			localStorage.setItem('username', currentUser.username);
		}
	}

	function generateMyStories() {
		$ownStories.empty();

		// if the user has no stories that they have posted
		if (currentUser.ownStories.length === 0) {
			$ownStories.append('<h5>No stories added by user yet!</h5>');
		} else {
			// for all of the user's posted stories
			for (let story of currentUser.ownStories) {
				// render each story in the list
				let ownStoryHTML = generateStoryHTML(story, true);
				$ownStories.append(ownStoryHTML);
			}
		}

		$ownStories.show();
	}

	function generateFaves() {
		// empty out the list by default
		$favoritedStories.empty();

		// if the user has no favorites
		if (currentUser.favorites.length === 0) {
			$favoritedStories.append('<h5>No favorites added!</h5>');
		} else {
			// for all of the user's favorites
			for (let story of currentUser.favorites) {
				// render each story in the list
				let favoriteHTML = generateStoryHTML(story, false, true);
				$favoritedStories.append(favoriteHTML);
			}
		}
	}
});
