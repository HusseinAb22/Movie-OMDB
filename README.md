
Movie-OMDB is a web application that allows users to search for movies and retrieve detailed information using the Open Movie Database (OMDb) API. Users can enter a movie title to fetch and display details such as the movie's title, release year, plot summary, and poster image. The application is built with HTML, CSS, and JavaScript, utilizing the Fetch API for asynchronous data requests. It features a user-friendly interface with dynamic DOM manipulation to present the fetched movie data.

Login Page: Registered users can log in by entering their email and password. Authentication verifies credentials before granting access to the application.
![Login](https://github.com/user-attachments/assets/621c93d7-89f4-4afa-b594-05ece6af8a01)



Sign-Up Page: Users can create an account by providing a username, email, and password(the password is saved using encryption in the DB). The system validates inputs and stores user credentials securely.
![Signup](https://github.com/user-attachments/assets/f446b37c-5a87-4679-a04f-a655eb4a1706)




The Home Page serves as the main interface of the Movie-OMDB application. Users can search for movies by entering a title in the search bar. The application then fetches and displays movie details, including the title, release year, plot summary, and poster image. The page is designed with a clean, user-friendly layout for easy navigation and interaction.
![Index](https://github.com/user-attachments/assets/6b7e04be-2216-494a-b2ec-628ece0814c7)

The Search Functionality in the Movie-OMDB application allows users to find movie details by entering a title in the search bar. When a user submits a search:

The application sends a request to the OMDb API with the entered movie title.
If a match is found, the movie's details (title, release year, plot summary, and poster) are displayed on the screen.
If no results are found, an error message is shown.



The Details Page provides comprehensive movie information along with interactive features:

Movie Title, Release Year, Plot Summary, Genre, Director, Cast, IMDb Rating, and Poster
Trailer: The trailer is fetched using the YouTube API, searching for the official movie trailer and embedding it directly on the page.
Favorites Management: Users can add or remove the movie from their favorites list.
Streaming Links: The page provides links to platforms where the movie is available for streaming, such as Netflix, Disney+, or Amazon Prime, allowing users to watch the movie easily.
![movie-details](https://github.com/user-attachments/assets/a9caf558-446a-4584-8cbe-10c9782b46c0)
![link-ading](https://github.com/user-attachments/assets/6f48f635-4855-4e70-b6d8-08cb283900cb)




The Favorites Page stores and displays all the movies a user has added to their favorites list.

Users can view their saved movies, including titles, posters, and key details.
Movies can be removed from favorites with a simple click.
Provides a convenient way to keep track of favorite films for quick access later.
![favorites-page](https://github.com/user-attachments/assets/8bb8aa78-8caf-412c-ab48-567fa644196f)

The Admin Page allows admins to monitor and manage the streaming links added by users:

View All Added Links: Admins can see all streaming links submitted by users for each movie.
View Link Ratings: Admins can view the ratings given to each link by users, helping to assess the quality of the links.
Delete Poor Links: Admins can delete links that are rated poorly or deemed unreliable by users.
![admin-page](https://github.com/user-attachments/assets/e3c423c0-e068-4b9f-80d2-932dac77be1b)




