// Titles: https://omdbapi.com/?s=thor&page=1&apikey=545f9db1
// details: http://www.omdbapi.com/?i=tt3896198&apikey=545f9db1

const movieSearchBox = document.getElementById('movie-search-box');
const searchList = document.getElementById('search-list');
const resultGrid = document.getElementById('result-grid');

// load movies from API
async function loadMovies(searchTerm){
    const URL = `https://omdbapi.com/?s=${searchTerm}&page=1&apikey=545f9db1`;
    const res = await fetch(`${URL}`);
    const data = await res.json();
    // console.log(data.Search);
    if(data.Response == "True") displayMovieList(data.Search);
}

function findMovies(){
    let searchTerm = (movieSearchBox.value).trim();
    if(searchTerm.length > 0){
        searchList.classList.remove('hide-search-list');
        loadMovies(searchTerm);
    } else {
        searchList.classList.add('hide-search-list');
    }
}

function displayMovieList(movies){
    searchList.innerHTML = "";
    for(let idx = 0; idx < movies.length; idx++){
        let movieListItem = document.createElement('div');
        movieListItem.dataset.id = movies[idx].imdbID; // setting movie id in  data-id
        movieListItem.classList.add('search-list-item');
        if(movies[idx].Poster != "N/A")
            moviePoster = movies[idx].Poster;
        else 
            moviePoster = "image_not_found.png";

        movieListItem.innerHTML = `
        <div class = "search-item-thumbnail">
            <img src = "${moviePoster}">
        </div>
        <div class = "search-item-info">
            <h3>${movies[idx].Title}</h3>
            <p>${movies[idx].Year}</p>
        </div>
        `;
        searchList.appendChild(movieListItem);
    }
    loadMovieDetails();
}

function loadMovieDetails(){
    const searchListMovies = searchList.querySelectorAll('.search-list-item');
    searchListMovies.forEach(movie => {
        movie.addEventListener('click', async () => {
            // console.log(movie.dataset.id);
            searchList.classList.add('hide-search-list');
            movieSearchBox.value = "";
            const result = await fetch(`http://www.omdbapi.com/?i=${movie.dataset.id}&apikey=fc1fef96`);
            const movieDetails = await result.json();
            // console.log(movieDetails);
            displayMovieDetails(movieDetails);
        });
    });
}

// Add this function to fetch movie trailer
async function getMovieTrailer(movieTitle, year) {
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${movieTitle} ${year} official trailer&type=video&key=AIzaSyBBcNF72oCRJRd96NiK5isCXB2pyyNG694`);
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            return data.items[0].id.videoId;
        }
        return null;
    } catch (error) {
        console.error('Error fetching trailer:', error);
        return null;
    }
}

// Update the displayMovieDetails function
async function displayMovieDetails(details) {
    const trailerVideoId = await getMovieTrailer(details.Title, details.Year);
    
    resultGrid.innerHTML = `
    <div class="movie-details-container">
        <div class="movie-content-wrapper">
            <div class="movie-basics">
                <div class="movie-poster">
                    <img src="${(details.Poster != "N/A") ? details.Poster : "image_not_found.png"}" alt="movie poster">
                    <div class="movie-rating-badge">
                        <span>⭐ ${details.imdbRating || 'N/A'}</span>
                        <small>IMDb Rating</small>
                    </div>
                </div>
                <div class="movie-info">
                    <h1 class="movie-title">${details.Title}</h1>
                    <div class="movie-meta">
                        <span class="year">${details.Year}</span>
                        <span class="rated">${details.Rated}</span>
                        <span class="runtime">${details.Runtime}</span>
                    </div>
                    <div class="movie-genre">${details.Genre}</div>
                    <div class="movie-plot">
                        <h3>Overview</h3>
                        <p>${details.Plot}</p>
                    </div>
                    <div class="movie-details-grid">
                        <div class="detail-item">
                            <h4>Director</h4>
                            <p>${details.Director}</p>
                        </div>
                        <div class="detail-item">
                            <h4>Writers</h4>
                            <p>${details.Writer}</p>
                        </div>
                        <div class="detail-item">
                            <h4>Stars</h4>
                            <p>${details.Actors}</p>
                        </div>
                        <div class="detail-item">
                            <h4>Release Date</h4>
                            <p>${details.Released}</p>
                        </div>
                        <div class="detail-item">
                            <h4>Language</h4>
                            <p>${details.Language}</p>
                        </div>
                        ${details.Awards !== "N/A" ? `
                        <div class="detail-item">
                            <h4>Awards</h4>
                            <p><i class="fas fa-award"></i> ${details.Awards}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            ${trailerVideoId ? `
            <div class="movie-trailer">
                <h3>Official Trailer</h3>
                <div class="trailer-container">
                    <iframe
                        src="https://www.youtube.com/embed/${trailerVideoId}"
                        frameborder="0"
                        allowfullscreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    ></iframe>
                </div>
            </div>
            ` : ''}
        </div>
    </div>
    `;

    const addToFavoritesBtn = document.createElement('button');
    addToFavoritesBtn.id = 'add-to-favorites';
    addToFavoritesBtn.className = `favorite-btn ${isFavorite(details.imdbID) ? 'active' : ''}`;
    addToFavoritesBtn.innerHTML = `
        <i class="fas ${isFavorite(details.imdbID) ? 'fa-star' : 'fa-star-o'}"></i>
        ${isFavorite(details.imdbID) ? 'Remove from Favorites' : 'Add to Favorites'}
    `;

    // Insert the button below the movie poster
    const moviePoster = document.querySelector('.movie-poster');
    moviePoster.appendChild(addToFavoritesBtn);

    addToFavoritesBtn.onclick = () => {
        if (isFavorite(details.imdbID)) {
            removeFromFavorites(details.imdbID);
            addToFavoritesBtn.innerHTML = '<i class="fas fa-star-o"></i> Add to Favorites';
            addToFavoritesBtn.classList.remove('active');
        } else {
            addToFavorites(details);
            addToFavoritesBtn.innerHTML = '<i class="fas fa-star"></i> Remove from Favorites';
            addToFavoritesBtn.classList.add('active');
        }
    };
}

// Add this new function to load default movies
async function loadDefaultMovies() {
    const URLs = [
        `https://omdbapi.com/?s=movie&type=movie&y=2024&plot=full&apikey=545f9db1`,
        `https://omdbapi.com/?s=avengers&type=movie&y=2024&plot=full&apikey=545f9db1`,
        `https://omdbapi.com/?s=action&type=movie&y=2024&plot=full&apikey=545f9db1`
    ];
    
    const suggestedMoviesGrid = document.createElement('div');
    suggestedMoviesGrid.className = 'suggested-movies-grid';
    
    resultGrid.innerHTML = `
        <h2 class="suggested-movies-title">Latest Movies</h2>
        <p style="color: #fff; text-align: center; margin-bottom: 30px; font-size: 1.2rem;">
            Discover the newest releases with high IMDb ratings
        </p>
    `;
    resultGrid.appendChild(suggestedMoviesGrid);

    try {
        const responses = await Promise.all(URLs.map(url => fetch(url)));
        const data = await Promise.all(responses.map(res => res.json()));
        const allMovies = data.flatMap(d => d.Search || []);
        
        // Filter movies and remove duplicates
        const uniqueMovies = [...new Map(allMovies
            .filter(movie => 
                movie.Type === 'movie' && 
                !movie.Title.toLowerCase().includes('awards') &&
                !movie.Title.toLowerCase().includes('ceremony') &&
                !movie.Title.toLowerCase().includes('election')&&
                !movie.Title.toLowerCase().includes('nominated')&&
                !movie.Title.toLowerCase().includes('winner')
            )
            .map(movie => [movie.imdbID, movie]))
            .values()];

        // Get detailed info for all movies including ratings
        const movieDetailsPromises = uniqueMovies.map(async (movie) => {
            const detailsURL = `http://www.omdbapi.com/?i=${movie.imdbID}&apikey=545f9db1`;
            const detailsRes = await fetch(detailsURL);
            return await detailsRes.json();
        });

        const moviesWithDetails = await Promise.all(movieDetailsPromises);
        
        // Filter, sort by rating, and take top 12
        const sortedMovies = moviesWithDetails
            .filter(details => details.Type === 'movie' && details.imdbRating && parseFloat(details.imdbRating) > 5)
            .sort((a, b) => parseFloat(b.imdbRating) - parseFloat(a.imdbRating))
            .slice(0, 12);

        // Display sorted movies
        sortedMovies.forEach(details => {
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            movieCard.dataset.id = details.imdbID;
            movieCard.innerHTML = `
                <div class="movie-poster">
                    <img src="${details.Poster != "N/A" ? details.Poster : "https://via.placeholder.com/300x450.png?text=No+Poster"}" 
                         alt="${details.Title}"
                         onerror="this.src='https://via.placeholder.com/300x450.png?text=Error+Loading+Poster'">
                </div>
                <div class="movie-info">
                    <h3>${details.Title}</h3>
                    <div class="movie-rating">
                        <span class="imdb-rating">⭐ ${details.imdbRating}</span>
                        <span class="year">${details.Year}</span>
                    </div>
                </div>
            `;
            
            movieCard.addEventListener('click', () => {
                displayMovieDetails(details);
            });
            
            suggestedMoviesGrid.appendChild(movieCard);
        });

    } catch (error) {
        console.error('Error loading movies:', error);
    }
}

// Add home icon click handler
document.addEventListener('DOMContentLoaded', () => {
    loadDefaultMovies();
    updateDisplayMovieDetails();
    
    const homeLink = document.getElementById('home-link');
    const favoritesLink = document.getElementById('favorites-link');
    
    homeLink.addEventListener('click', loadDefaultMovies);
    favoritesLink.addEventListener('click', displayFavoritesPage);
});

window.addEventListener('click', (event) => {
    if(event.target.className != "form-control"){
        searchList.classList.add('hide-search-list');
    }
});

// Add these functions to handle search page
async function handleSearch() {
    const searchTerm = movieSearchBox.value.trim();
    if (searchTerm.length > 0) {
        searchList.classList.add('hide-search-list');
        displaySearchResults(searchTerm);
    }
}

async function displaySearchResults(searchTerm) {
    resultGrid.innerHTML = `
        <h2 class="search-results-title">Search Results for "${searchTerm}"</h2>
        <div class="search-results-grid"></div>
    `;
    
    const searchResultsGrid = resultGrid.querySelector('.search-results-grid');
    
    try {
        // First get exact title matches
        const exactMatchResponse = await fetch(`https://omdbapi.com/?t=${searchTerm}&type=movie&apikey=545f9db1`);
        const exactMatch = await exactMatchResponse.json();
        
        // Then get similar titles
        const similarResponse = await fetch(`https://omdbapi.com/?s=${searchTerm}&type=movie&apikey=545f9db1`);
        const similarData = await similarResponse.json();
        
        let allMovies = [];
        
        // Add exact match if found
        if (exactMatch.Response === "True") {
            allMovies.push(exactMatch);
        }
        
        // Add similar matches if found
        if (similarData.Response === "True") {
            // Filter out duplicates and sort by relevance
            const similarMovies = similarData.Search.filter(movie => 
                movie.Title.toLowerCase().includes(searchTerm.toLowerCase()) &&
                (!exactMatch.Response || movie.imdbID !== exactMatch.imdbID)
            );
            
            // Get detailed info for similar movies
            const detailsPromises = similarMovies.map(async (movie) => {
                const detailsRes = await fetch(`http://www.omdbapi.com/?i=${movie.imdbID}&apikey=545f9db1`);
                return await detailsRes.json();
            });
            
            const movieDetails = await Promise.all(detailsPromises);
            allMovies = [...allMovies, ...movieDetails];
        }
        
        if (allMovies.length > 0) {
            // Sort movies by relevance and rating
            allMovies.sort((a, b) => {
                // Exact title match gets highest priority
                const aExactMatch = a.Title.toLowerCase() === searchTerm.toLowerCase();
                const bExactMatch = b.Title.toLowerCase() === searchTerm.toLowerCase();
                if (aExactMatch && !bExactMatch) return -1;
                if (!aExactMatch && bExactMatch) return 1;
                
                // Then sort by IMDb rating
                const aRating = parseFloat(a.imdbRating) || 0;
                const bRating = parseFloat(b.imdbRating) || 0;
                return bRating - aRating;
            });
            
            // Display sorted movies
            allMovies.forEach(movie => {
                const movieCard = document.createElement('div');
                movieCard.className = 'movie-card';
                movieCard.dataset.id = movie.imdbID;
                movieCard.innerHTML = `
                    <div class="movie-poster">
                        <img src="${movie.Poster != "N/A" ? movie.Poster : "https://via.placeholder.com/300x450.png?text=No+Poster"}" 
                             alt="${movie.Title}"
                             onerror="this.src='https://via.placeholder.com/300x450.png?text=Error+Loading+Poster'">
                    </div>
                    <div class="movie-info">
                        <h3>${movie.Title}</h3>
                        <div class="movie-rating">
                            <span class="imdb-rating">⭐ ${movie.imdbRating || 'N/A'}</span>
                            <span class="year">${movie.Year}</span>
                        </div>
                    </div>
                `;
                
                movieCard.addEventListener('click', () => {
                    displayMovieDetails(movie);
                });
                
                searchResultsGrid.appendChild(movieCard);
            });
        } else {
            searchResultsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: #fff;">
                    <h3>No movies found for "${searchTerm}"</h3>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('search-button');
    searchButton.addEventListener('click', handleSearch);
    
    // Add enter key support
    movieSearchBox.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
});

// Add this function to handle favorites
function addToFavorites(movie) {
    let favorites = JSON.parse(localStorage.getItem('movieFavorites')) || [];
    if (!favorites.some(fav => fav.imdbID === movie.imdbID)) {
        favorites.push(movie);
        localStorage.setItem('movieFavorites', JSON.stringify(favorites));
    }
}

function removeFromFavorites(movieId) {
    let favorites = JSON.parse(localStorage.getItem('movieFavorites')) || [];
    favorites = favorites.filter(movie => movie.imdbID !== movieId);
    localStorage.setItem('movieFavorites', JSON.stringify(favorites));
}

function isFavorite(movieId) {
    const favorites = JSON.parse(localStorage.getItem('movieFavorites')) || [];
    return favorites.some(movie => movie.imdbID === movieId);
}

// Add sorting functions
function sortByTitle(a, b) {
    return a.Title.localeCompare(b.Title);
}

function sortByRating(a, b) {
    return parseFloat(b.imdbRating || 0) - parseFloat(a.imdbRating || 0);
}

function sortByDate(a, b) {
    return new Date(b.Released) - new Date(a.Released);
}

// Update favorites page display function
function displayFavoritesPage(sortMethod = 'rating') {
    const favorites = JSON.parse(localStorage.getItem('movieFavorites')) || [];
    
    // Sort favorites based on selected method
    let sortedFavorites = [...favorites];
    switch(sortMethod) {
        case 'title':
            sortedFavorites.sort(sortByTitle);
            break;
        case 'date':
            sortedFavorites.sort(sortByDate);
            break;
        case 'rating':
        default:
            sortedFavorites.sort(sortByRating);
    }
    
    resultGrid.innerHTML = `
        <div class="favorites-header">
            <h2 class="suggested-movies-title">My Favorite Movies</h2>
            <div class="sort-controls">
                <label>Sort by:</label>
                <select id="sort-select" class="sort-select">
                    <option value="rating" ${sortMethod === 'rating' ? 'selected' : ''}>Rating</option>
                    <option value="title" ${sortMethod === 'title' ? 'selected' : ''}>Title</option>
                    <option value="date" ${sortMethod === 'date' ? 'selected' : ''}>Release Date</option>
                </select>
            </div>
        </div>
        <div class="search-results-grid">
            ${sortedFavorites.length === 0 ? 
                '<div style="grid-column: 1/-1; text-align: center; color: #fff;"><h3>No favorite movies added yet</h3></div>' 
                : ''}
        </div>
    `;
    
    const favoritesGrid = resultGrid.querySelector('.search-results-grid');
    const sortSelect = document.getElementById('sort-select');
    
    sortSelect.addEventListener('change', (e) => {
        displayFavoritesPage(e.target.value);
    });
    
    sortedFavorites.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.innerHTML = `
            <div class="movie-poster">
                <img src="${movie.Poster != "N/A" ? movie.Poster : "https://via.placeholder.com/300x450.png?text=No+Poster"}" 
                     alt="${movie.Title}">
                <button class="remove-favorite" data-id="${movie.imdbID}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="movie-info">
                <h3>${movie.Title}</h3>
                <div class="movie-rating">
                    <span class="imdb-rating">⭐ ${movie.imdbRating || 'N/A'}</span>
                    <span class="year">${movie.Year}</span>
                </div>
            </div>
        `;
        
        movieCard.addEventListener('click', (e) => {
            if (!e.target.closest('.remove-favorite')) {
                displayMovieDetails(movie);
            }
        });
        
        favoritesGrid.appendChild(movieCard);
    });
    
    // Add remove button handlers
    document.querySelectorAll('.remove-favorite').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const movieId = button.dataset.id;
            removeFromFavorites(movieId);
            displayFavoritesPage(sortSelect.value);
        });
    });
}

// Update the displayMovieDetails function to include favorite button
function updateDisplayMovieDetails() {
    const originalFunction = displayMovieDetails;
    displayMovieDetails = async function(details) {
        await originalFunction(details);
        
        // Add favorite button after the content is loaded
        const movieBasics = document.querySelector('.movie-basics');
        const favoriteBtn = document.createElement('button');

        
        favoriteBtn.addEventListener('click', () => {
            if (isFavorite(details.imdbID)) {
                removeFromFavorites(details.imdbID);
                favoriteBtn.innerHTML = '<i class="fas fa-heart-o"></i> Add to Favorites';
                favoriteBtn.classList.remove('active');
            } else {
                addToFavorites(details);
                favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Remove from Favorites';
                favoriteBtn.classList.add('active');
            }
        });
        
        movieBasics.insertBefore(favoriteBtn, movieBasics.firstChild);
    };
}