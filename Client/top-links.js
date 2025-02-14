const API = 'feaa855b';

document.addEventListener('DOMContentLoaded', async () => {
    const userName = sessionStorage.getItem('userName');
    if (userName) {
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = userName;
        }
    }

    document.getElementById('home-link').addEventListener('click', () => {
        window.location.href = '/';
    });

    document.getElementById('favorites-link').addEventListener('click', () => {
        window.location.href = '/favorites.html';
    });

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

    async function fetchTopLinks(sortBy = 'rating') {
        try {
            const response = await fetch(`/api/top-links?sortBy=${sortBy}`, {
                credentials: 'include'
                
            });
            if (!response.ok) throw new Error('Failed to fetch top links');
            return await response.json();
        } catch (error) {
            swal("Error", "Failed to load top links", "error");
            return { movies: [] };
        }
    }

    async function displayTopLinks(sortBy) {
        const moviesGrid = document.getElementById('movies-grid');
        moviesGrid.innerHTML = '';
        
        const { movies } = await fetchTopLinks(sortBy);
        
        for (const movie of movies) {
            try {
                const response = await fetch(`http://omdbapi.com/?i=${movie.topLink.movieId}&apikey=${API}`);
                
                if (!response.ok) {
                    console.error('API Response not ok:', response.status, response.statusText);
                    continue;
                }
                
                const details = await response.json();
                
                
                if (details.Response === "True") {
                    const movieCard = document.createElement('div');
                    movieCard.className = 'movie-card';
                    const posterUrl = details.Poster !== "N/A" ? details.Poster : "image_not_found.png";
                    
                    movieCard.innerHTML = `
                        <div class="movie-poster">
                            <img src="${posterUrl}" 
                                 alt="${details.Title}" 
                                 onerror="this.src='https://via.placeholder.com/300x450.png?text=Error+Loading+Poster'"
                                 >
                        </div>
                        <div class="movie-info">
                            <h3>${details.Title}</h3>
                            <div class="top-link">
                                <a href="${movie.topLink.url}" target="_blank">${movie.topLink.name}</a>
                                <div class="link-stats">
                                    <span class="clicks">👆 ${movie.topLink.clicks || 0}</span>
                                    <span class="rating">
                                        <span class="stars">
                                            ${'★'.repeat(Math.round(movie.topLink.averageRating || 0))}${'☆'.repeat(5 - Math.round(movie.topLink.averageRating || 0))}
                                        </span>
                                        (${movie.topLink.reviews?.length || 0})
                                    </span>
                                </div>
                            </div>
                        </div>
                    `;
                    moviesGrid.appendChild(movieCard);

                    movieCard.querySelector('.top-link a').addEventListener('click', async (e) => {
                        e.preventDefault();
                        const linkUrl = e.target.href;
                        
                        try {
                            const response = await fetch('/movie-links/' + movie.topLink._id + '/click', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                credentials: 'include'
                            });

                            if (!response.ok) throw new Error('Failed to track click');
                            
                            const data = await response.json();
                            if (data.success) {
                                const clicksSpan = e.target.closest('.top-link').querySelector('.clicks');
                                if (clicksSpan) {
                                    clicksSpan.textContent = `👆 ${data.clicks}`;
                                }
                                window.open(linkUrl, '_blank');
                            }
                        } catch (error) {
                            console.error('Error tracking click:', error);
                            swal("Error", "Failed to track click", "error");
                        }
                    });
                }
            } catch (error) {
                console.error('Error fetching movie details:', error);
            }
        }
    }

    const sortBtns = document.querySelectorAll('.sort-btn');
    sortBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sortBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            displayTopLinks(btn.dataset.sort);
        });
    });
    

    displayTopLinks('rating');
});
