const API = 'feaa855b';  


document.addEventListener('DOMContentLoaded', async () => {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
        window.location.href = '/Login';
        return;
    }
    loadLinks();
});

async function checkAdminStatus() {
    try {
        const response = await fetch('/api/admin/check', {
            credentials: 'include'
        });
        return response.ok;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

async function loadLinks(page = 1) {
    try {
        const response = await fetch(`/api/admin/links?page=${page}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            throw new Error(errorData.message || 'Failed to fetch links');
        }

        const data = await response.json();
        
        if (!data.links || !Array.isArray(data.links)) {
            throw new Error('Invalid data format received');
        }

        displayLinks(data.links);
        updatePagination(data.currentPage, data.totalPages);
    } catch (error) {
        console.error('Error loading links:', error);
        if (error.message.includes('Not authenticated')) {
            window.location.href = '/Login';
            return;
        }
        swal("Error", "Failed to load links", "error");
    }
}

async function displayLinks(links) {
    const tbody = document.getElementById('links-data');
    tbody.innerHTML = '';

    for (const link of links) {
        try {
            
            const response = await fetch(`https://omdbapi.com/?i=${link.movieId}&apikey=${API}`);
            console.log('Movie ID:', link.movieId);
            if (!response.ok) {
                throw new Error('Failed to fetch movie details');
            }
            const movieDetails = await response.json();
            console.log('Movie Details:', movieDetails);
            
            if (!movieDetails || movieDetails.Error) {
                throw new Error(movieDetails.Error || 'Invalid movie data');
            }
            
            const tr = document.createElement('tr');
            const avgRating = Math.round(link.averageRating) || 0;
            tr.innerHTML = `
                <td>${link.username}</td>
                <td>${movieDetails.Title || 'Unknown Title'}</td>
                <td>${link.name}</td>
                <td><a href="${link.url}" target="_blank">${link.url}</a></td>
                <td>${link.clicks}</td>
                <td>${link.isPublic ? 'Public' : 'Private'}</td>
                <td>${new Date(link.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="rating-section">
                        <div class="average-rating">
                            <span class="stars" style="color: #ffd900;">
                                ${'★'.repeat(avgRating)}${'☆'.repeat(5 - avgRating)}
                            </span>
                            <span class="rating-count">(${link.reviews?.length || 0} reviews)</span>
                        </div>
                    </div>
                    <button class="delete-btn" onclick="deleteLink('${link._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

            tbody.appendChild(tr);
        } catch (error) {
            console.error('Error fetching movie details:', error);
           
        }
    }
}

function updatePagination(currentPage, totalPages) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        button.onclick = () => loadLinks(i);
        pagination.appendChild(button);
    }
}

async function deleteLink(linkId) {
    try {
        const willDelete = await swal({
            title: "Delete Link",
            text: "Are you sure you want to delete this link?",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        });

        if (willDelete) {
            const response = await fetch(`/api/admin/links/${linkId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to delete link');
            }

            await loadLinks();
            swal("Success", "Link deleted successfully", "success");
        }
    } catch (error) {
        console.error('Error deleting link:', error);
        swal("Error", "Failed to delete link", "error");
    }
}

async function handleLogout() {
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            
            sessionStorage.clear();
            window.location.href = '/login';
        } else {
            throw new Error('Logout failed');
        }
    } catch (error) {
        console.error('Error logging out:', error);
        swal("Error", "Failed to logout", "error");
    }
} 