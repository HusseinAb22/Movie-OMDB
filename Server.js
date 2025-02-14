const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const morgan = require("morgan");
const dotenv = require("dotenv");
const jwt=require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const User = require('./models/User');
const UserFavorites = require('./models/UserFavorites');
const Link = require('./models/Link');
const adminRoutes = require('./routes/admin');


// Load environment variables
dotenv.config();
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });



const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(morgan("combined")); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "Views"));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI, 
        ttl: 24 * 60 * 60 // 1 day session expiration
    }),
    cookie: {
        secure: process.env.NODE_ENV === "production" ? true : false,
        httpOnly: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Admin middleware
const isAdmin = async (req, res, next) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.isAdmin) {
            return res.status(401).json({ success: false, message: "Unauthorized - Admin access required" });
        }
        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Admin routes
app.get('/admin.html', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'Client', 'admin.html'));
});
app.use('/api/admin', adminRoutes);

// Ensure data directory exists
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}


app.get("/", (req, res) => {
    res.render("Home", { 
        user: req.session.user || null,
        isAdmin: req.session.user ? req.session.user.isAdmin : false 
    });
});
app.get("/home", (req, res) => res.render("Home"));
app.get("/login", (req, res) => res.render("Login"));
app.get("/signup", (req, res) => res.render("Signup"));




app.use("/Client", express.static(path.join(__dirname, "Client"), { index: "index.html" }));
app.use(express.static('Client'));

// Set view engine and views directory
// Logout route
app.get("/Client/logout", (req, res) => {
    res.redirect("/logout");
});
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ success: false, message: "Error logging out" });
        }
        res.redirect("/");
    });
});

// Authentication middleware
const authMiddleware = (req, res, next) => {

    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    next();
};

// Check authentication status
app.get('/check-auth', (req, res) => {
    if (req.session.user) {
        res.json({ 
            authenticated: true, 
            user: {
                firstName: req.session.user.firstName,
                email: req.session.user.email
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Users file path
const usersFile = path.join(dataDir, "users.json");

// Signup route
app.post("/signup", [
    body("firstName").isString().trim().isLength({ min: 1, max: 50 }),
    body("email").isEmail(),
    body("password").matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,15}$/),
    body("confirmPassword").custom((value, { req }) => value === req.body.password)
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { firstName, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email is already registered." });
        }

        // Create new user
        const user = new User({ firstName, email, password });
        await user.save();

        req.session.user = { firstName: user.firstName, email: user.email };
        res.json({ success: true });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Login route
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).json({ success: false, message: "Invalid credentials." });
        }

        req.session.user = {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            isAdmin: user._id=='67aca6732f5ea62aeae5fe95'?true:false
        };

        console.log('Login session:', req.session);

        res.json({
            success: true,
            user: {
                _id: user._id,
                firstName: user.firstName,
                isAdmin: user._id=='67aca6732f5ea62aeae5fe95'?true:false
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Error-handling middleware
app.use((err, req, res, next) => {
    console.error("Unexpected error:", err.message);
    res.status(500).json({ success: false, message: "An unexpected error occurred" });
});

// Serve the favorites page
app.get("/Client/favorites", authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, "Client", "favorites.html"));
});

// Add/remove favorites endpoint
app.post("/favorites", authMiddleware, async (req, res) => {
    try {
        const { imdbID, title, poster, year } = req.body;
        if (!imdbID || !title || !poster || !year) {
            return res.status(400).json({ success: false, message: "Invalid data provided" });
        }

        const userEmail = req.session.user.email;
        let userFavorites = await UserFavorites.findOne({ email: userEmail });

        if (!userFavorites) {
            userFavorites = new UserFavorites({ email: userEmail, favorites: [] });
        }

        const existingIndex = userFavorites.favorites.findIndex(movie => movie.imdbID === imdbID);
        if (existingIndex !== -1) {
            userFavorites.favorites.splice(existingIndex, 1);
        } else {
            userFavorites.favorites.push({ imdbID, title, poster, year });
        }

        await userFavorites.save();

        res.json({
            success: true,
            message: existingIndex !== -1 ? "Removed from favorites" : "Added to favorites",
            favorites: userFavorites.favorites
        });
    } catch (error) {
        console.error('Favorites operation error:', error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Get user favorites endpoint
app.get("/favorites", authMiddleware, async (req, res) => {
    try {
        const userEmail = req.session.user.email;
        const userFavorites = await UserFavorites.findOne({ email: userEmail });
        
        res.json({ 
            success: true, 
            favorites: userFavorites ? userFavorites.favorites : [] 
        });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ success: false, message: "Error fetching favorites" });
    }
});

// Add DELETE endpoint for removing favorites
app.delete("/favorites", authMiddleware, async (req, res) => {
    try {
        const { imdbID } = req.body;
        if (!imdbID) {
            return res.status(400).json({ success: false, message: "Movie ID is required" });
        }

        const userEmail = req.session.user.email;
        let userFavorites = await UserFavorites.findOne({ email: userEmail });

        if (!userFavorites) {
            return res.status(404).json({ success: false, message: "No favorites found" });
        }

       
        userFavorites.favorites = userFavorites.favorites.filter(movie => movie.imdbID !== imdbID);
        await userFavorites.save();

        res.json({
            success: true,
            message: "Removed from favorites",
            favorites: userFavorites.favorites
        });
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


app.get("movie-links/:movieId", (req, res) => {
    res.redirect(`/movie-links/${req.params.movieId}`);
});

// Get movie links (including public links from other users)
app.get('/movie-links/:movieId', authMiddleware, async (req, res) => {
    try {
        const { movieId } = req.params;
        const userId = req.session.user._id;

        const links = await Link.aggregate([
            { $match: { movieId: movieId } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $addFields: {
                    isOwner: {
                        $eq: ['$userId', new mongoose.Types.ObjectId(userId)]
                    },
                    username: '$user.firstName'
                }
            },
            {
                $match: {
                    $or: [
                        { isOwner: true },
                        { isPublic: true }
                    ]
                }
            },
            {
                $project: {
                    _id: 1,
                    movieId: 1,
                    name: 1,
                    url: 1,
                    description: 1,
                    isPublic: 1,
                    clicks: 1,
                    reviews: 1,
                    averageRating: 1,
                    isOwner: 1,
                    username: 1,
                    createdAt: 1
                }
            }
        ]);

        res.json({ success: true, links });
    } catch (error) {
        console.error('Error fetching movie links:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch movie links' });
    }
});

// Add new link
app.post("/movie-links/:movieId", authMiddleware, async (req, res) => {
    try {
        const { movieId } = req.params;
        const user = await User.findOne({ email: req.session.user.email });
        if (!user) {
            throw new Error('User not found');
        }
        const userId = user._id;
        const { name, url, description, isPublic } = req.body;

        console.log('Creating new link:', {
            movieId,
            userId,
            name,
            url,
            description,
            isPublic
        });

        const newLink = new Link({
            movieId,
            userId,
            name,
            url,
            description,
            isPublic
        });

        const savedLink = await newLink.save();
        console.log('Link saved successfully:', savedLink);

        res.json({ 
            success: true, 
            link: savedLink,
            message: 'Link added successfully'
        });
    } catch (error) {
        console.error('Error adding link:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Error adding link" 
        });
    }
});

// Update link
app.put('/movie-links/:linkId', authMiddleware, async (req, res) => {
    try {
        const { linkId } = req.params;
        const { name, url, description, isPublic } = req.body;
        const userId = req.session.user._id;

        const link = await Link.findOne({ _id: linkId, userId });
        
        if (!link) {
            return res.status(404).json({ success: false, message: 'Link not found or unauthorized' });
        }

        link.name = name;
        link.url = url;
        link.description = description;
        link.isPublic = isPublic;

        await link.save();
        res.json({ success: true, link });
    } catch (error) {
        console.error('Error updating link:', error);
        res.status(500).json({ success: false, message: 'Error updating link' });
    }
});

// Delete link
app.delete('/movie-links/:linkId', authMiddleware, async (req, res) => {
    try {
        const { linkId } = req.params;
        const userId = req.session.user._id;

        const result = await Link.deleteOne({ _id: linkId, userId });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Link not found or unauthorized' });
        }

        res.json({ success: true, message: 'Link deleted successfully' });
    } catch (error) {
        console.error('Error deleting link:', error);
        res.status(500).json({ success: false, message: 'Error deleting link' });
    }
});

// Add review to a link
app.post("/movie-links/:movieId/:linkId/reviews", authMiddleware, async (req, res) => {
    try {
        const { linkId } = req.params;
        const { rating } = req.body;
        const userId = req.session.user._id;
        const userName = req.session.user.firstName;

        const link = await Link.findById(linkId);
        if (!link) {
            return res.status(404).json({ success: false, message: "Link not found" });
        }

        // Check if user has already reviewed
        const existingReview = link.reviews.find(r => r.userId.toString() === userId.toString());
        if (existingReview) {
            return res.status(400).json({ success: false, message: "You have already reviewed this link" });
        }

        // Add new review with just the rating
        link.reviews.push({ 
            userId, 
            userName, 
            rating: parseInt(rating),
            createdAt: new Date()
        });
        
        // Update average rating
        const totalRating = link.reviews.reduce((sum, review) => sum + review.rating, 0);
        link.averageRating = totalRating / link.reviews.length;

        await link.save();
        res.json({ success: true, link });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ success: false, message: "Error adding review" });
    }
});

// Check if user has already reviewed
app.get("/movie-links/:movieId/:linkId/check-review", authMiddleware, async (req, res) => {
    try {
        const { linkId } = req.params;
        const userId = req.session.user._id;

        const link = await Link.findById(linkId);
        if (!link) {
            return res.status(404).json({ success: false, message: "Link not found" });
        }

        const hasReviewed = link.reviews.some(review => 
            review.userId.toString() === userId.toString()
        );

        res.json({ success: true, hasReviewed });
    } catch (error) {
        console.error('Error checking review:', error);
        res.status(500).json({ success: false, message: "Error checking review" });
    }
});

app.get("/movie/:movieId", authMiddleware, async (req, res) => {
    try {
        const { movieId } = req.params;
        const userId = req.session.user._id;
        
        // Get user's favorites to check if this movie is favorited
        const userFavorites = await UserFavorites.findOne({ email: req.session.user.email });
        const isFavorited = userFavorites?.favorites.some(movie => movie.imdbID === movieId) || false;
        
        // Get movie links
        const links = await Link.aggregate([
            { $match: { movieId: movieId } },
            {
                $addFields: {
                    isOwner: { $eq: ['$userId', new mongoose.Types.ObjectId(userId)] }
                }
            },
            {
                $match: {
                    $or: [
                        { isOwner: true },
                        { isPublic: true }
                    ]
                }
            }
        ]);

        res.sendFile(path.join(__dirname, "Client", "index.html"));
    } catch (error) {
        console.error('Error handling movie details:', error);
        res.status(500).send('Server error');
    }
});

// Utility functions
function loadJSON(filePath) {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath));
}

function saveJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Debugging route
app.get("/debug-session", (req, res) => {
    console.log("Session data:", req.session);
    res.json({ session: req.session });
});

app.post('/logout', (req, res) => {
    // Clear the session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ success: false, message: 'Failed to logout' });
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// Get all links route
app.get('/api/admin/links', isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const links = await Link.find()
            .populate('userId', 'firstName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Link.countDocuments();
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            links: links.map(link => ({
                _id: link._id,
                username: link.userId ? link.userId.firstName : 'Unknown',
                name: link.name,
                url: link.url,
                clicks: link.clicks,
                isPublic: link.isPublic,
                createdAt: link.createdAt,
                averageRating: link.averageRating
            })),
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error('Error fetching links:', error);
        res.status(500).json({ success: false, message: 'Error fetching links' });
    }
});

// Delete link route
app.delete('/api/admin/links/:id', isAdmin, async (req, res) => {
    try {
        await Link.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Link deleted successfully' });
    } catch (error) {
        console.error('Error deleting link:', error);
        res.status(500).json({ success: false, message: 'Error deleting link' });
    }
});


app.post('/movie-links/:linkId/click', authMiddleware, async (req, res) => {
    try {
        const { linkId } = req.params;
        const link = await Link.findById(linkId);
        
        if (!link) {
            return res.status(404).json({ success: false, message: 'Link not found' });
        }

        link.clicks = (link.clicks || 0) + 1;
        await link.save();

        res.json({ success: true, clicks: link.clicks });
    } catch (error) {
        console.error('Error tracking click:', error);
        res.status(500).json({ success: false, message: 'Error tracking click' });
    }
});



app.get('/api/top-links', authMiddleware, async (req, res) => {
    try {
        const { sortBy = 'rating' } = req.query;
        const sortField = sortBy === 'rating' ? 'averageRating' : 'clicks';
        
        const movies = await Link.aggregate([
            { $match: { isPublic: true } },
            { $sort: { [sortField]: -1 } },
            {
                $group: {
                    _id: '$movieId',
                    topLink: { $first: '$$ROOT' }
                }
            },
            {
                $project: {
                    movieId: '$_id',
                    topLink: 1,
                    _id: 0
                }
            }
        ]);
        
        res.json({ success: true, movies });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch top links' });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}).on("error", (err) => {
    console.error("Failed to start server:", err.message);
});