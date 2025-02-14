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
async function displayFavoritesPage(sortMethod = 'rating') {
    const favorites = await fetchFavorites();

    
    let sortedFavorites = [...favorites];
    switch (sortMethod) {
        case 'title':
            sortedFavorites.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'date':
            sortedFavorites.sort((a, b) => new Date(a.year) - new Date(b.year));
            break;
        case 'rating':
        default:
            sortedFavorites.sort((a, b) => b.imdbRating - a.imdbRating);
    }

    const resultGrid = document.querySelector('.search-results-grid');
    resultGrid.innerHTML = `
        ${sortedFavorites.length === 0 ?
            '<div style="grid-column: 1/-1; text-align: center; color: #fff;"><h3>No favorite movies added yet</h3></div>'
            : ''}
    `;

    sortedFavorites.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.innerHTML = `
            <div class="movie-poster">
                <img src="${movie.poster != "N/A" ? movie.poster : "https://via.placeholder.com/300x450.png?text=No+Poster"}" 
                     alt="${movie.title}">
                <button class="remove-favorite" data-id="${movie.imdbID}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <div class="movie-rating">
                    <span class="imdb-rating">⭐ ${movie.imdbRating || 'N/A'}</span>
                    <span class="year">${movie.year}</span>
                </div>
            </div>
        `;

        movieCard.querySelector('.remove-favorite').addEventListener('click', async (e) => {
            e.stopPropagation();
            const movieId = e.target.closest('.remove-favorite').dataset.id;
            await removeFromFavorites(movieId);
            displayFavoritesPage(sortMethod);
        });

        resultGrid.appendChild(movieCard);
    });

    const sortSelect = document.getElementById('sort-select');
    sortSelect.addEventListener('change', (e) => {
        displayFavoritesPage(e.target.value);
    });
}


document.addEventListener('DOMContentLoaded', async () => {
    
    const userName = sessionStorage.getItem('userName');
    if (userName) {
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = userName;
        }
    }

    
    document.getElementById('logout-link').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('userName'); 
        window.location.href = '/Login';
    });

    
    document.getElementById('home-link').addEventListener('click', () => {
        window.location.href = '/Client/index.html';
    });

    
    await displayFavoritesPage();
});

const homeLink = document.getElementById('home-link');
homeLink.addEventListener('click', ()=>{
    window.location.href = '/Client/index.html';
});


onload = displayFavoritesPage;