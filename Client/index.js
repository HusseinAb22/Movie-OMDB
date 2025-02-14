

const movieSearchBox = document.getElementById('movie-search-box');
const searchList = document.getElementById('search-list');
const resultGrid = document.getElementById('result-grid');
const API='feaa855b';


async function loadMovies(searchTerm){
    const URL = `https://omdbapi.com/?s=${searchTerm}&page=1&apikey=${API}`;
    const res = await fetch(`${URL}`);
    const data = await res.json();
    if(data.Response == "True") displayMovieList(data.Search);
}

async function findMovies() {
    const searchTerm = document.getElementById('movie-search-box').value.trim();
    if (searchTerm.length > 0) {
        const response = await fetch(`http://www.omdbapi.com/?s=${searchTerm}&apikey=${API}`);
        const data = await response.json();
        
        if (data.Response === "True") {
            displayMovieList(data.Search);
        }
    }
}

function displayMovieList(movies) {
    const searchList = document.getElementById('search-list');
    searchList.innerHTML = "";
    
    movies.forEach(movie => {
        const movieListItem = document.createElement('div');
        movieListItem.dataset.id = movie.imdbID;
        movieListItem.classList.add('search-list-item');
        
        const posterUrl = movie.Poster !== "N/A" ? movie.Poster : "image_not_found.png";

        movieListItem.innerHTML = `
            <div class="search-item-thumbnail">
                <img src="${posterUrl}" alt="${movie.Title}">
            </div>
            <div class="search-item-info">
                <h3>${movie.Title}</h3>
                <p>${movie.Year}</p>
            </div>
        `;

        movieListItem.addEventListener('click', async () => {
            const response = await fetch(`http://www.omdbapi.com/?i=${movie.imdbID}&apikey=${API}`);
            const movieDetails = await response.json();
            await displayMovieDetails(movieDetails);
        });

        searchList.appendChild(movieListItem);
    });
}

function loadMovieDetails(){
    const searchListMovies = searchList.querySelectorAll('.search-list-item');
    searchListMovies.forEach(movie => {
        movie.addEventListener('click', async () => {
            searchList.classList.add('hide-search-list');
            movieSearchBox.value = "";
            const result = await fetch(`http://www.omdbapi.com/?i=${movie.dataset.id}&apikey=${API}}`);
            const movieDetails = await result.json();
            window.location.href = `/movie/${movie.imdbID}`;
        });
    });
}


async function getMovieTrailer(movieTitle, year) {
    try {
        // First try with movie title and year
        let query = encodeURIComponent(`${movieTitle} ${year} official trailer`);
        const apiKey = 'AIzaSyActQvgioPAZXnfruNpG1JTx94RbYuzvyk';
        let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=1&key=${apiKey}`;
        
        let response = await fetch(url);
        
        // If first attempt fails, try without the year
        if (!response.ok) {
            query = encodeURIComponent(`${movieTitle} official trailer`);
            url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=1&key=${apiKey}`;
            response = await fetch(url);
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('YouTube API Error:', errorData);
            return null;
        }
        
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
    const resultGrid = document.getElementById('result-grid');
    const isFav = await isFavorite(details.imdbID);
    const trailerVideoId = await getMovieTrailer(details.Title, details.Year);
    
    resultGrid.innerHTML = `
        <div class="movie-details">
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
                <div class="movie-links-section">
                    <h3>Movie Links</h3>
                    <div id="movie-links-container"></div>
                    ${isFav ? `
                        <button id="add-link-btn" class="add-link-btn">
                            <i class="fas fa-plus"></i> Add New Link
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    // Add favorites button code
    const addToFavoritesBtn = document.createElement('button');
    addToFavoritesBtn.id = 'add-to-favorites';
    addToFavoritesBtn.className = `favorite-btn ${await isFavorite(details.imdbID) ? 'active' : ''}`;
    addToFavoritesBtn.innerHTML = `
        <i class="fas ${await isFavorite(details.imdbID) ? 'fa-star' : 'fa-star-o'}"></i>
        ${await isFavorite(details.imdbID) ? 'Remove from Favorites' : 'Add to Favorites'}
    `;

    // Insert the button below the movie poster
    const moviePoster = document.querySelector('.movie-poster');
    moviePoster.appendChild(addToFavoritesBtn);

    // Initialize links manager for all movies
    await showLinksManager(details.imdbID);
    
    // Add event listener for the add link button only if movie is in favorites
    if (isFav) {
        const addLinkBtn = document.getElementById('add-link-btn');
        if (addLinkBtn) {
            addLinkBtn.onclick = () => addNewLink(details.imdbID);
        }
    }

    addToFavoritesBtn.onclick = async () => {
        try {
            if (await isFavorite(details.imdbID)) {
                await removeFromFavorites(details.imdbID);
                addToFavoritesBtn.innerHTML = '<i class="fas fa-star-o"></i> Add to Favorites';
                addToFavoritesBtn.classList.remove('active');
            } else {
                await addToFavorites(details);
                addToFavoritesBtn.innerHTML = '<i class="fas fa-star"></i> Remove from Favorites';
                addToFavoritesBtn.classList.add('active');
            }
        } catch (error) {
            console.error('Error updating favorites:', error);
            swal("Error", "Failed to update favorites", "error");
        }
    };
}

// Add this new function to load default movies
async function loadDefaultMovies() {
    const mainstreamKeywords = [
        'avengers', 'spider', 'batman', 'superman', 'marvel', 'dc', 
        'jurassic', 'fast', 'furious', 'transformers', 'matrix', 
        'john wick', 'movie'
    ];

    // Generate URLs dynamically for each keyword and year
    const URLs = mainstreamKeywords.flatMap(keyword => [
        `https://omdbapi.com/?s=${keyword}&type=movie&y=2024&plot=full&apikey=${API}`,
        `https://omdbapi.com/?s=${keyword}&type=movie&y=2023&plot=full&apikey=${API}`,
        `https://omdbapi.com/?s=${keyword}&type=movie&y=2022&plot=full&apikey=${API}`
    ]);

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
        // Fetch data from all URLs
        const responses = await Promise.all(URLs.map(url => fetch(url)));
        const data = await Promise.all(responses.map(res => res.json()));
        const allMovies = data.flatMap(d => d.Search || []);

        // Filter movies and remove duplicates
        const uniqueMovies = [...new Map(allMovies
            .filter(movie => 
                movie.Type === 'movie' && 
                !movie.Title.toLowerCase().includes('awards') &&
                !movie.Title.toLowerCase().includes('ceremony') &&
                !movie.Title.toLowerCase().includes('election') &&
                !movie.Title.toLowerCase().includes('nominated') &&
                !movie.Title.toLowerCase().includes('winner')
            )
            .map(movie => [movie.imdbID, movie]))
            .values()];

        // Get detailed info for all movies including ratings
        const movieDetailsPromises = uniqueMovies.map(async (movie) => {
            const detailsURL = `http://www.omdbapi.com/?i=${movie.imdbID}&apikey=${API}`;
            const detailsRes = await fetch(detailsURL);
            return await detailsRes.json();
        });

        const moviesWithDetails = await Promise.all(movieDetailsPromises);


        const sortedMovies = moviesWithDetails
            .filter(details => details.Type === 'movie' && details.imdbRating && parseFloat(details.imdbRating) > 5)
            .sort((a, b) => parseFloat(b.imdbRating) - parseFloat(a.imdbRating))
            .slice(0, 12);

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
            
            movieCard.addEventListener('click', async () => {
                const response = await fetch(`http://www.omdbapi.com/?i=${details.imdbID}&apikey=${API}`);
                const movieDetails = await response.json();
                await displayMovieDetails(movieDetails);
            });
            
            suggestedMoviesGrid.appendChild(movieCard);
        });

    } catch (error) {
        console.error('Error loading movies:', error);
    }
}


document.addEventListener('DOMContentLoaded', async () => {

    const path = window.location.pathname;
    const movieIdMatch = path.match(/\/movie\/(.+)/);
    
    if (movieIdMatch) {

        const movieId = movieIdMatch[1];
        try {
            const response = await fetch(`http://www.omdbapi.com/?i=${movieId}&apikey=${API}`);
            if (!response.ok) throw new Error('Failed to fetch movie details');
            const movieDetails = await response.json();
            await displayMovieDetails(movieDetails);
            
            await showLinksManager(movieId);
        } catch (error) {
            console.error('Error:', error);
            swal("Error", "Failed to load movie details", "error");
        }
    } else {

        loadDefaultMovies();
    }
    

    const userName = sessionStorage.getItem('userName');
    if (userName) {
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = userName;
        }
    }

    document.getElementById('logout-link').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                sessionStorage.clear(); 
                window.location.href = '/Login'; 
            }
        } catch (error) {
            console.error('Logout error:', error);
            swal("Error", "Failed to logout", "error");
        }
    });


    const homeLink = document.getElementById('home-link');
    const favoritesLink = document.getElementById('favorites-link');
    
    homeLink.addEventListener('click', loadDefaultMovies);
    favoritesLink.addEventListener('click', () => {
        window.location.href = '/Client/favorites';
    });


    const searchInput = document.getElementById('movie-search-box');
    const searchList = document.getElementById('search-list');

    if (searchInput) {
        searchInput.addEventListener('input', findMovies);
        searchInput.addEventListener('click', findMovies);
    }

});

window.addEventListener('click', (event) => {
    if(event.target.className != "form-control"){
        searchList.classList.add('hide-search-list');
    }
});


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

        const exactMatchResponse = await fetch(`https://omdbapi.com/?t=${searchTerm}&type=movie&apikey=${API}`);
        const exactMatch = await exactMatchResponse.json();
        
        const similarResponse = await fetch(`https://omdbapi.com/?s=${searchTerm}&type=movie&apikey=${API}`);
        const similarData = await similarResponse.json();
        
        let allMovies = [];
        

        if (exactMatch.Response === "True") {
            allMovies.push(exactMatch);
        }
        

        if (similarData.Response === "True") {
            const similarMovies = similarData.Search.filter(movie => 
                movie.Title.toLowerCase().includes(searchTerm.toLowerCase()) &&
                (!exactMatch.Response || movie.imdbID !== exactMatch.imdbID)
            );
            
            const detailsPromises = similarMovies.map(async (movie) => {
                const detailsRes = await fetch(`http://www.omdbapi.com/?i=${movie.imdbID}&apikey=${API}`);
                return await detailsRes.json();
            });
            
            const movieDetails = await Promise.all(detailsPromises);
            allMovies = [...allMovies, ...movieDetails];
        }
        
        if (allMovies.length > 0) {

            allMovies.sort((a, b) => {

                const aExactMatch = a.Title.toLowerCase() === searchTerm.toLowerCase();
                const bExactMatch = b.Title.toLowerCase() === searchTerm.toLowerCase();
                if (aExactMatch && !bExactMatch) return -1;
                if (!aExactMatch && bExactMatch) return 1;
                
                const aRating = parseFloat(a.imdbRating) || 0;
                const bRating = parseFloat(b.imdbRating) || 0;
                return bRating - aRating;
            });
            
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
                
                movieCard.addEventListener('click', async () => {
                    const response = await fetch(`http://www.omdbapi.com/?i=${movie.imdbID}&apikey=${API}`);
                    const movieDetails = await response.json();
                    await displayMovieDetails(movieDetails);
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

document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('search-button');
    searchButton.addEventListener('click', handleSearch);
    
    movieSearchBox.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
});





function sortByTitle(a, b) {
    return a.Title.localeCompare(b.Title);
}

function sortByRating(a, b) {
    return parseFloat(b.imdbRating || 0) - parseFloat(a.imdbRating || 0);
}

function sortByDate(a, b) {
    return new Date(b.Released) - new Date(a.Released);
}



    

function updateDisplayMovieDetails() {
    const originalFunction = displayMovieDetails;
    displayMovieDetails = async function(details) {
        await originalFunction(details);
        
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

async function fetchFavorites() {
    try {
        const response = await fetch('/favorites', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' 
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.warn("User is not logged in.");
                return [];
            }
            throw new Error('Failed to fetch favorites');
        }

        const data = await response.json();
        return data.favorites || [];
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return [];
    }
}

async function addToFavorites(movie) {
    try {
        const response = await fetch('/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', 
            body: JSON.stringify({
                imdbID: movie.imdbID,
                title: movie.Title,
                poster: movie.Poster,
                year: movie.Year
            })
        });
        if (!response.ok) throw new Error('Failed to add to favorites');
        const data = await response.json();
        swal("Added to Favorites!", `${movie.Title} has been added to your favorites.`, "success");
        return data;
    } catch (error) {
        console.error('Error adding to favorites:', error);
    }
}

async function removeFromFavorites(movieId) {
    try {
        const response = await fetch('/favorites', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', 
            body: JSON.stringify({ imdbID: movieId }) 
        });
        if (!response.ok) throw new Error('Failed to remove from favorites');
        const data = await response.json();
        swal("Removed from Favorites!", "The movie has been removed from your favorites.", "error");
        return data;
    } catch (error) {
        console.error('Error removing from favorites:', error);
        swal("Error", "Failed to remove from favorites", "error");
    }
}

async function isFavorite(movieId) {
    try {
        const response = await fetch('/favorites', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' 
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.warn("User is not logged in.");
                return false;
            }
            throw new Error('Failed to fetch favorites');
        }

        const data = await response.json();
        const favorites = data.favorites || [];
        
        return favorites.some(movie => movie.imdbID === movieId);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return false;
    }
}

async function saveMovieLink(movieId, linkData) {
    try {
        console.log('Attempting to save link:', { movieId, linkData });
        const response = await fetch(`/movie-links/${movieId}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(linkData)
        });

        console.log('Server response status:', response.status);
        const data = await response.json();
        console.log('Server response data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Failed to save link');
        }

        return data;
    } catch (error) {
        console.error('Error in saveMovieLink:', error);
        throw error;
    }
}

async function deleteMovieLink(movieId, linkId) {
    try {
        const response = await fetch(`/movie-links/${movieId}/${linkId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to delete link');
        return await response.json();
    } catch (error) {
        console.error('Error deleting link:', error);
        swal("Error", "Failed to delete link", "error");
    }
}

async function updateMovieLink(movieId, linkId, linkData) {
    try {
        const response = await fetch(`/movie-links/${movieId}/${linkId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(linkData)
        });
        if (!response.ok) throw new Error('Failed to update link');
        return await response.json();
    } catch (error) {
        console.error('Error updating link:', error);
        swal("Error", "Failed to update link", "error");
    }
}

async function showLinksManager(movieId, userPage = 1, publicPage = 1, linksPerPage = 3, sortBy = 'clicks') {
    const linksContainer = document.getElementById('movie-links-container');
    if (!linksContainer) return;
    
    const currentUserId = sessionStorage.getItem('userId');

    try {
        const response = await fetch(`/movie-links/${movieId}`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to fetch links');
        const data = await response.json();
        
        
        linksContainer.innerHTML = '';

        
        const sortingControls = document.createElement('div');
        sortingControls.className = 'sorting-controls';
        sortingControls.innerHTML = `
            <label>Sort by: </label>
            <select id="sort-links">
                <option value="clicks" ${sortBy === 'clicks' ? 'selected' : ''}>Most Clicked</option>
                <option value="rating" ${sortBy === 'rating' ? 'selected' : ''}>Highest Rated</option>
                <option value="newest" ${sortBy === 'newest' ? 'selected' : ''}>Newest First</option>
            </select>
        `;
        linksContainer.appendChild(sortingControls);

       
        const sortSelect = document.getElementById('sort-links');
        sortSelect.addEventListener('change', (e) => {
            showLinksManager(movieId, userPage, publicPage, linksPerPage, e.target.value);
        });

       
        const sortLinks = (links) => {
            switch(sortBy) {
                case 'rating':
                    return links.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
                case 'newest':
                    return links.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                case 'clicks':
                default:
                    return links.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
            }
        };

       
        const userLinks = sortLinks(data.links.filter(link => link.isOwner));
        const publicLinks = sortLinks(data.links.filter(link => !link.isOwner && link.isPublic));

    
        if (userLinks.length > 0) {
            const userStartIndex = (userPage - 1) * linksPerPage;
            const userEndIndex = userStartIndex + linksPerPage;
            const paginatedUserLinks = userLinks.slice(userStartIndex, userEndIndex);
            const totalUserPages = Math.ceil(userLinks.length / linksPerPage);

            const userSection = document.createElement('div');
            userSection.className = 'links-section user-links';
            
            const headerDiv = document.createElement('h4');
            headerDiv.textContent = `Your Links (${userLinks.length})`;
            userSection.appendChild(headerDiv);

           
            paginatedUserLinks.forEach(link => {
                const linkElement = document.createElement('div');
                linkElement.className = 'link-item';
                linkElement.dataset.id = link._id;
                
                const userRating = link.reviews?.find(r => r.userId === currentUserId)?.rating || 0;
                const avgRating = Math.round(link.averageRating || 0);

                linkElement.innerHTML = `
                    <div class="link-content">
                        <div class="link-header">
                            <h4>${link.name}</h4>
                            ${link.isOwner ? `
                                <div class="link-actions">
                                    <button class="edit-link" title="Edit Link">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="delete-link" title="Delete Link">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                        <p class="link-description">${link.description || ''}</p>
                        <div class="link-meta">
                            <a href="#" class="track-click" data-url="${link.url}">Visit Link</a>
                            <span class="clicks">👆 ${link.clicks || 0} clicks</span>
                            <span class="visibility">${link.isPublic ? '🌎 Public' : '🔒 Private'}</span>
                            <span class="added-by">Added by: ${link.username}</span>
                        </div>
                        <div class="rating-container">
                            <div class="stars-section">
                                <div class="average-rating">
                                    <span class="stars ${link.reviews?.length > 0 ? 'has-reviews' : ''}">
                                        ${Array(5).fill().map((_, i) => 
                                            `<span class="star ${i < Math.round(link.averageRating || 0) ? 'active' : ''}" 
                                             data-rating="${i + 1}">★</span>`
                                        ).join('')}
                                    </span>
                                    <span class="rating-count">(${link.reviews?.length || 0} reviews)</span>
                                </div>
                                <div class="user-rating">
                                    <span class="rating-label">Your rating:</span>
                                    <div class="stars">
                                        ${Array(5).fill().map((_, i) => 
                                            `<span class="star ${i < userRating ? 'active' : ''}" 
                                             data-rating="${i + 1}">★</span>`
                                        ).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                
                if (link.isOwner) {
                    const editBtn = linkElement.querySelector('.edit-link');
                    editBtn.addEventListener('click', () => {
                        swal({
                            title: "Edit Link",
                            content: {
                                element: "div",
                                attributes: {
                                    innerHTML: `
                                        <input id="edit-name" class="swal2-input" placeholder="Link Name" value="${link.name}">
                                        <input id="edit-url" class="swal2-input" placeholder="URL" value="${link.url}">
                                        <textarea id="edit-description" class="swal2-textarea" placeholder="Description">${link.description || ''}</textarea>
                                        <label class="checkbox-container">
                                            <input type="checkbox" id="edit-public" ${link.isPublic ? 'checked' : ''}>
                                            Make this link public
                                        </label>
                                    `
                                }
                            },
                            buttons: {
                                cancel: true,
                                confirm: {
                                    text: "Save Changes",
                                    value: true
                                }
                            }
                        }).then(async (willUpdate) => {
                            if (willUpdate) {
                                const updatedData = {
                                    name: document.getElementById('edit-name').value,
                                    url: document.getElementById('edit-url').value,
                                    description: document.getElementById('edit-description').value,
                                    isPublic: document.getElementById('edit-public').checked
                                };

                                try {
                                    const response = await fetch(`/movie-links/${link._id}`, {
                                        method: 'PUT',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        credentials: 'include',
                                        body: JSON.stringify(updatedData)
                                    });

                                    if (!response.ok) throw new Error('Failed to update link');
                                    
                                    await showLinksManager(movieId);
                                    swal("Success!", "Link updated successfully", "success");
                                } catch (error) {
                                    console.error('Error updating link:', error);
                                    swal("Error", "Failed to update link", "error");
                                }
                            }
                        });
                    });

                    
                    const deleteBtn = linkElement.querySelector('.delete-link');
                    deleteBtn.addEventListener('click', () => {
                        swal({
                            title: "Are you sure?",
                            text: "Once deleted, you will not be able to recover this link!",
                            icon: "warning",
                            buttons: true,
                            dangerMode: true,
                        }).then(async (willDelete) => {
                            if (willDelete) {
                                try {
                                    const response = await fetch(`/movie-links/${link._id}`, {
                                        method: 'DELETE',
                                        credentials: 'include'
                                    });

                                    if (!response.ok) throw new Error('Failed to delete link');
                                    
                                    await showLinksManager(movieId);
                                    swal("Success!", "Link deleted successfully", "success");
                                } catch (error) {
                                    console.error('Error deleting link:', error);
                                    swal("Error", "Failed to delete link", "error");
                                }
                            }
                        });
                    });
                }

                
                const linkUrl = linkElement.querySelector('.track-click');
                linkUrl.addEventListener('click', async (e) => {
                    e.preventDefault();
                    try {
                        const response = await fetch(`/movie-links/${link._id}/click`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (!response.ok) throw new Error('Failed to track click');
                        
                        const data = await response.json();
                        if (data.success) {
                            const clicksSpan = linkElement.querySelector('.clicks');
                            if (clicksSpan) {
                                clicksSpan.textContent = `👆 ${data.clicks} clicks`;
                            }
                            window.open(linkUrl.dataset.url, '_blank');
                        }
                    } catch (error) {
                        console.error('Error tracking click:', error);
                        swal("Error", "Failed to track click", "error");
                    }
                });
                
                
                const stars = linkElement.querySelectorAll('.star');
                stars.forEach(star => {
                    star.addEventListener('click', async () => {
                        if (!sessionStorage.getItem('userId')) {
                            swal("Error", "Please log in to rate links", "error");
                            return;
                        }

                        try {
                            const rating = parseInt(star.dataset.rating);
                            const response = await fetch(`/movie-links/${movieId}/${link._id}/reviews`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                credentials: 'include',
                                body: JSON.stringify({ rating })
                            });

                            const data = await response.json();
                            
                            if (!response.ok) {
                                throw new Error(data.message || 'Failed to add rating');
                            }

                            
                            const starsContainer = star.closest('.stars');
                            const allStars = starsContainer.querySelectorAll('.star');
                            allStars.forEach((s, index) => {
                                if (index < rating) {
                                    s.classList.add('active');
                                } else {
                                    s.classList.remove('active');
                                }
                            });

                            await showLinksManager(movieId);
                            swal("Success!", "Rating added successfully", "success");
                        } catch (error) {
                            console.error('Error adding rating:', error);
                            swal("Error", error.message || "Failed to add rating", "error");
                        }
                    });
                });
                
                userSection.appendChild(linkElement);
            });

            
            if (totalUserPages > 1) {
                const userPaginationDiv = document.createElement('div');
                userPaginationDiv.className = 'pagination';
                
                if (userPage > 1) {
                    const prevButton = document.createElement('button');
                    prevButton.className = 'prev-btn';
                    prevButton.textContent = '←';
                    prevButton.onclick = () => showLinksManager(movieId, userPage - 1, publicPage, linksPerPage, sortBy);
                    userPaginationDiv.appendChild(prevButton);
                }
                
                for (let i = 1; i <= totalUserPages; i++) {
                    const pageButton = document.createElement('button');
                    pageButton.className = `page-btn ${i === parseInt(userPage) ? 'active' : ''}`;
                    pageButton.textContent = i;
                    pageButton.onclick = () => showLinksManager(movieId, i, publicPage, linksPerPage, sortBy);
                    userPaginationDiv.appendChild(pageButton);
                }
                
                if (userPage < totalUserPages) {
                    const nextButton = document.createElement('button');
                    nextButton.className = 'next-btn';
                    nextButton.textContent = '→';
                    nextButton.onclick = () => showLinksManager(movieId, userPage + 1, publicPage, linksPerPage, sortBy);
                    userPaginationDiv.appendChild(nextButton);
                }

                userSection.appendChild(userPaginationDiv);
            }

            linksContainer.appendChild(userSection);
        }

        
        if (publicLinks.length > 0) {
            const publicStartIndex = (publicPage - 1) * linksPerPage;
            const publicEndIndex = publicStartIndex + linksPerPage;
            const paginatedPublicLinks = publicLinks.slice(publicStartIndex, publicEndIndex);
            const totalPublicPages = Math.ceil(publicLinks.length / linksPerPage);

            const publicSection = document.createElement('div');
            publicSection.className = 'links-section public-links';
            
            const headerDiv = document.createElement('h4');
            headerDiv.textContent = `Public Links (${publicLinks.length})`;
            publicSection.appendChild(headerDiv);

            paginatedPublicLinks.forEach(link => {
                const linkElement = document.createElement('div');
                linkElement.className = 'link-item';
                
                
                const userRating = link.reviews?.find(r => r.userId === currentUserId)?.rating || 0;
                const avgRating = Math.round(link.averageRating || 0);

                linkElement.innerHTML = `
                    <div class="link-content">
                        <div class="link-header">
                            <h4>${link.name}</h4>
                            ${link.isOwner ? `
                                <div class="link-actions">
                                    <button class="edit-link" title="Edit Link">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="delete-link" title="Delete Link">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                        <p class="link-description">${link.description || ''}</p>
                        <div class="link-meta">
                            <a href="#" class="track-click" data-url="${link.url}">Visit Link</a>
                            <span class="clicks">👆 ${link.clicks || 0} clicks</span>
                            <span class="visibility">${link.isPublic ? '🌎 Public' : '🔒 Private'}</span>
                            <span class="added-by">Added by: ${link.username}</span>
                        </div>
                        <div class="rating-container">
                            <div class="stars-section">
                                <div class="average-rating">
                                    <span class="stars ${link.reviews?.length > 0 ? 'has-reviews' : ''}">
                                        ${Array(5).fill().map((_, i) => 
                                            `<span class="star ${i < Math.round(link.averageRating || 0) ? 'active' : ''}" 
                                             data-rating="${i + 1}">★</span>`
                                        ).join('')}
                                    </span>
                                    <span class="rating-count">(${link.reviews?.length || 0} reviews)</span>
                                </div>
                                <div class="user-rating">
                                    <span class="rating-label">Your rating:</span>
                                    <div class="stars">
                                        ${Array(5).fill().map((_, i) => 
                                            `<span class="star ${i < userRating ? 'active' : ''}" 
                                             data-rating="${i + 1}">★</span>`
                                        ).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                
                if (link.isOwner) {
                    const editBtn = linkElement.querySelector('.edit-link');
                    editBtn.addEventListener('click', () => {
                        swal({
                            title: "Edit Link",
                            content: {
                                element: "div",
                                attributes: {
                                    innerHTML: `
                                        <input id="edit-name" class="swal2-input" placeholder="Link Name" value="${link.name}">
                                        <input id="edit-url" class="swal2-input" placeholder="URL" value="${link.url}">
                                        <textarea id="edit-description" class="swal2-textarea" placeholder="Description">${link.description || ''}</textarea>
                                        <label class="checkbox-container">
                                            <input type="checkbox" id="edit-public" ${link.isPublic ? 'checked' : ''}>
                                            Make this link public
                                        </label>
                                    `
                                }
                            },
                            buttons: {
                                cancel: true,
                                confirm: {
                                    text: "Save Changes",
                                    value: true
                                }
                            }
                        }).then(async (willUpdate) => {
                            if (willUpdate) {
                                const updatedData = {
                                    name: document.getElementById('edit-name').value,
                                    url: document.getElementById('edit-url').value,
                                    description: document.getElementById('edit-description').value,
                                    isPublic: document.getElementById('edit-public').checked
                                };

                                try {
                                    const response = await fetch(`/movie-links/${link._id}`, {
                                        method: 'PUT',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        credentials: 'include',
                                        body: JSON.stringify(updatedData)
                                    });

                                    if (!response.ok) throw new Error('Failed to update link');
                                    
                                    await showLinksManager(movieId);
                                    swal("Success!", "Link updated successfully", "success");
                                } catch (error) {
                                    console.error('Error updating link:', error);
                                    swal("Error", "Failed to update link", "error");
                                }
                            }
                        });
                    });

                    
                    const deleteBtn = linkElement.querySelector('.delete-link');
                    deleteBtn.addEventListener('click', () => {
                        swal({
                            title: "Are you sure?",
                            text: "Once deleted, you will not be able to recover this link!",
                            icon: "warning",
                            buttons: true,
                            dangerMode: true,
                        }).then(async (willDelete) => {
                            if (willDelete) {
                                try {
                                    const response = await fetch(`/movie-links/${link._id}`, {
                                        method: 'DELETE',
                                        credentials: 'include'
                                    });

                                    if (!response.ok) throw new Error('Failed to delete link');
                                    
                                    await showLinksManager(movieId);
                                    swal("Success!", "Link deleted successfully", "success");
                                } catch (error) {
                                    console.error('Error deleting link:', error);
                                    swal("Error", "Failed to delete link", "error");
                                }
                            }
                        });
                    });
                }

               
                const linkUrl = linkElement.querySelector('.track-click');
                linkUrl.addEventListener('click', async (e) => {
                    e.preventDefault();
                    try {
                        const response = await fetch(`/movie-links/${link._id}/click`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (!response.ok) throw new Error('Failed to track click');
                        
                        const data = await response.json();
                        if (data.success) {
                            const clicksSpan = linkElement.querySelector('.clicks');
                            if (clicksSpan) {
                                clicksSpan.textContent = `👆 ${data.clicks} clicks`;
                            }
                            window.open(linkUrl.dataset.url, '_blank');
                        }
                    } catch (error) {
                        console.error('Error tracking click:', error);
                        swal("Error", "Failed to track click", "error");
                    }
                });

                
                const stars = linkElement.querySelectorAll('.star');
                stars.forEach(star => {
                    star.addEventListener('click', async () => {
                        if (!sessionStorage.getItem('userId')) {
                            swal("Error", "Please log in to rate links", "error");
                            return;
                        }

                        try {
                            const rating = parseInt(star.dataset.rating);
                            const response = await fetch(`/movie-links/${movieId}/${link._id}/reviews`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                credentials: 'include',
                                body: JSON.stringify({ rating })
                            });

                            const data = await response.json();
                            
                            if (!response.ok) {
                                throw new Error(data.message || 'Failed to add rating');
                            }

                            
                            const starsContainer = star.closest('.stars');
                            const allStars = starsContainer.querySelectorAll('.star');
                            allStars.forEach((s, index) => {
                                if (index < rating) {
                                    s.classList.add('active');
                                } else {
                                    s.classList.remove('active');
                                }
                            });

                            await showLinksManager(movieId);
                            swal("Success!", "Rating added successfully", "success");
                        } catch (error) {
                            console.error('Error adding rating:', error);
                            swal("Error", error.message || "Failed to add rating", "error");
                        }
                    });
                });

                publicSection.appendChild(linkElement);
            });

            
            if (totalPublicPages > 1) {
                const publicPaginationDiv = document.createElement('div');
                publicPaginationDiv.className = 'pagination';
                
                if (publicPage > 1) {
                    const prevButton = document.createElement('button');
                    prevButton.className = 'prev-btn';
                    prevButton.textContent = '←';
                    prevButton.onclick = () => showLinksManager(movieId, userPage, publicPage - 1, linksPerPage, sortBy);
                    publicPaginationDiv.appendChild(prevButton);
                }
                
                for (let i = 1; i <= totalPublicPages; i++) {
                    const pageButton = document.createElement('button');
                    pageButton.className = `page-btn ${i === parseInt(publicPage) ? 'active' : ''}`;
                    pageButton.textContent = i;
                    pageButton.onclick = () => showLinksManager(movieId, userPage, i, linksPerPage, sortBy);
                    publicPaginationDiv.appendChild(pageButton);
                }
                
                if (publicPage < totalPublicPages) {
                    const nextButton = document.createElement('button');
                    nextButton.className = 'next-btn';
                    nextButton.textContent = '→';
                    nextButton.onclick = () => showLinksManager(movieId, userPage, publicPage + 1, linksPerPage, sortBy);
                    publicPaginationDiv.appendChild(nextButton);
                }

                publicSection.appendChild(publicPaginationDiv);
            }

            linksContainer.appendChild(publicSection);
        }

    } catch (error) {
        console.error('Error loading links:', error);
        linksContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load links. Error: ${error.message}</p>
            </div>
        `;
    }
}

function renderLinksList(links, movieId, isOwner) {
    const currentUserId = sessionStorage.getItem('userId');
    const linksContainer = document.getElementById('movie-links-container');
    linksContainer.innerHTML = '';

    links.forEach(link => {
        const linkElement = document.createElement('div');
        linkElement.className = 'link-item';
        
        linkElement.innerHTML = `
            <div class="link-content">
                <div class="link-header">
                    <h4>${link.name}</h4>
                    ${link.isOwner ? `
                        <div class="link-actions">
                            <button class="edit-link" title="Edit Link">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-link" title="Delete Link">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
                <p class="link-description">${link.description || ''}</p>
                <div class="link-meta">
                    <a href="#" class="track-click" data-url="${link.url}">Visit Link</a>
                    <span class="clicks">👆 ${link.clicks || 0} clicks</span>
                    <span class="visibility">${link.isPublic ? '🌎 Public' : '🔒 Private'}</span>
                    <span class="added-by">Added by: ${link.username}</span>
                </div>
                <div class="rating-container">
                    <div class="stars-section">
                        <div class="average-rating">
                            <span class="stars ${link.reviews?.length > 0 ? 'has-reviews' : ''}">
                                ${Array(5).fill().map((_, i) => 
                                    `<span class="star ${i < Math.round(link.averageRating || 0) ? 'active' : ''}" 
                                     data-rating="${i + 1}">★</span>`
                                ).join('')}
                            </span>
                            <span class="rating-count">(${link.reviews?.length || 0} reviews)</span>
                        </div>
                        <div class="user-rating">
                            <span class="rating-label">Your rating:</span>
                            <div class="stars">
                                ${Array(5).fill().map((_, i) => 
                                    `<span class="star ${i < userRating ? 'active' : ''}" 
                                     data-rating="${i + 1}">★</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        
        if (link.isOwner) {
            const editBtn = linkElement.querySelector('.edit-link');
            editBtn.addEventListener('click', () => {
                swal({
                    title: "Edit Link",
                    content: {
                        element: "div",
                        attributes: {
                            innerHTML: `
                                <input id="edit-name" class="swal2-input" placeholder="Link Name" value="${link.name}">
                                <input id="edit-url" class="swal2-input" placeholder="URL" value="${link.url}">
                                <textarea id="edit-description" class="swal2-textarea" placeholder="Description">${link.description || ''}</textarea>
                                <label class="checkbox-container">
                                    <input type="checkbox" id="edit-public" ${link.isPublic ? 'checked' : ''}>
                                    Make this link public
                                </label>
                            `
                        }
                    },
                    buttons: {
                        cancel: true,
                        confirm: {
                            text: "Save Changes",
                            value: true
                        }
                    }
                }).then(async (willUpdate) => {
                    if (willUpdate) {
                        const updatedData = {
                            name: document.getElementById('edit-name').value,
                            url: document.getElementById('edit-url').value,
                            description: document.getElementById('edit-description').value,
                            isPublic: document.getElementById('edit-public').checked
                        };

                        try {
                            const response = await fetch(`/movie-links/${link._id}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                credentials: 'include',
                                body: JSON.stringify(updatedData)
                            });

                            if (!response.ok) throw new Error('Failed to update link');
                            
                            await showLinksManager(movieId);
                            swal("Success!", "Link updated successfully", "success");
                        } catch (error) {
                            console.error('Error updating link:', error);
                            swal("Error", "Failed to update link", "error");
                        }
                    }
                });
            });

            
            const deleteBtn = linkElement.querySelector('.delete-link');
            deleteBtn.addEventListener('click', () => {
                swal({
                    title: "Are you sure?",
                    text: "Once deleted, you will not be able to recover this link!",
                    icon: "warning",
                    buttons: true,
                    dangerMode: true,
                }).then(async (willDelete) => {
                    if (willDelete) {
                        try {
                            const response = await fetch(`/movie-links/${link._id}`, {
                                method: 'DELETE',
                                credentials: 'include'
                            });

                            if (!response.ok) throw new Error('Failed to delete link');
                            
                            await showLinksManager(movieId);
                            swal("Success!", "Link deleted successfully", "success");
                        } catch (error) {
                            console.error('Error deleting link:', error);
                            swal("Error", "Failed to delete link", "error");
                        }
                    }
                });
            });
        }

        
        const linkUrl = linkElement.querySelector('.track-click');
        linkUrl.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const response = await fetch(`/movie-links/${link._id}/click`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) throw new Error('Failed to track click');
                
                const data = await response.json();
                if (data.success) {
                    const clicksSpan = linkElement.querySelector('.clicks');
                    if (clicksSpan) {
                        clicksSpan.textContent = `👆 ${data.clicks} clicks`;
                    }
                    window.open(linkUrl.dataset.url, '_blank');
                }
            } catch (error) {
                console.error('Error tracking click:', error);
                swal("Error", "Failed to track click", "error");
            }
        });

        
        const stars = linkElement.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', async () => {
                if (!sessionStorage.getItem('userId')) {
                    swal("Error", "Please log in to rate links", "error");
                    return;
                }

                try {
                    const rating = parseInt(star.dataset.rating);
                    const response = await fetch(`/movie-links/${movieId}/${link._id}/reviews`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({ rating })
                    });

                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.message || 'Failed to add rating');
                    }

                    
                    const starsContainer = star.closest('.stars');
                    const allStars = starsContainer.querySelectorAll('.star');
                    allStars.forEach((s, index) => {
                        if (index < rating) {
                            s.classList.add('active');
                        } else {
                            s.classList.remove('active');
                        }
                    });

                    await showLinksManager(movieId);
                    swal("Success!", "Rating added successfully", "success");
                } catch (error) {
                    console.error('Error adding rating:', error);
                    swal("Error", error.message || "Failed to add rating", "error");
                }
            });
        });

        linksContainer.appendChild(linkElement);
    });
}

async function addNewLink(movieId) {
    swal({
        title: "Add New Link",
        content: {
            element: "div",
            attributes: {
                innerHTML: `
                    <input id="link-name" class="swal2-input" placeholder="Link Name">
                    <input id="link-url" class="swal2-input" placeholder="URL">
                    <textarea id="link-description" class="swal2-textarea" placeholder="Description"></textarea>
                    <label class="checkbox-container">
                        <input type="checkbox" id="link-public">
                        Make this link public
                    </label>
                `
            }
        },
        buttons: {
            cancel: true,
            confirm: {
                text: "Add Link",
                value: true
            }
        }
    }).then(async (willAdd) => {
        if (willAdd) {
            const linkData = {
                name: document.getElementById('link-name').value,
                url: document.getElementById('link-url').value,
                description: document.getElementById('link-description').value,
                isPublic: document.getElementById('link-public').checked
            };

            try {
                await saveMovieLink(movieId, linkData);
                await showLinksManager(movieId);
                swal("Success!", "Link added successfully", "success");
            } catch (error) {
                console.error('Error adding link:', error);
                swal("Error", "Failed to add link", "error");
            }
        }
    });
}