const express = require("express");
const app = express();
const _ = require("lodash");
const bodyParser = require("body-parser");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const PORT = process.env.PORT || 5000;

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

app.set("view engine", "ejs");
app.use("/client", express.static(path.join(__dirname, "client")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set to true if using https
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(express.static("./Views/Resource"));
app.get("/", (req, res) => {
    res.render("Home");
});
app.get("/home", (req, res) => {
    console.log("Home Page");
    res.render("Home");
});

app.get("/login", (req, res) => {
    res.render("Login");
});
app.get("/signup", (req, res) => {
    res.render("Signup");
});
app.get("./Client/index", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "index.html"));
});

app.get("/Client/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

const usersFile = path.join(__dirname, "data", "users.json");

app.post("/signup", (req, res) => {
    const { firstName, email, password, confirmPassword } = req.body;
    if (!firstName || !email || !password || !confirmPassword) {
        errorMessage = "Please input all fields.";
    }

    const users = loadJSON(usersFile);
    if (_.includes(users.email, email)) {
        errorMessage = "Email is already registered.";
    }
    let errorMessage = null;
    if (!_.isString(firstName) || firstName.length === 0 || firstName.length > 50) {
        errorMessage = "Please input a valid first name!!.";
    } else if (password !== confirmPassword) {
        errorMessage = "Passwords do not match.";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,15}$/.test(password)) {
        errorMessage = "Password must be 6-15 characters and include a lowercase letter, an uppercase letter, and a digit.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errorMessage = "Invalid email format.";
    } else if (users.some(user => user.email === email)) {
        errorMessage = "Email is already registered.";
    }

    if (errorMessage) {
        return res.status(400).json({ success: false, message: errorMessage });
    }

    const newUser = { firstName, email, password };
    users.push(newUser);
    saveJSON(usersFile, users);

    req.session.user = newUser;

    res.json({ success: true });
});

function loadJSON(filePath) {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath));
}

function saveJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getFavoritesFilePath(email) {
    const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
    return path.join(__dirname, "data", `${sanitizedEmail}_Favorites.json`);
}

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const users = loadJSON(usersFile);

    const user = users.find(user => user.email === email && user.password === password);
    if (!user) {
        return res.status(400).json({ success: false, message: "Invalid credentials." });
    }

    req.session.user = user;
    res.json({ success: true });
});

// Authentication middleware
const authMiddleware = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    next();
};

// Add session check endpoint
app.get('/check-auth', (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});
const favoritesFilePath = path.join(__dirname, "data", "UserFavorites.json");

app.post("/favorites", authMiddleware, (req, res) => {
    const { imdbID, title, poster, year } = req.body;

    if (!imdbID || !title || !poster || !year) {
        return res.status(400).json({ success: false, message: "Invalid data provided" });
    }

    try {
        // Load the current favorites from the JSON file
        const allFavorites = fs.existsSync(favoritesFilePath)
            ? JSON.parse(fs.readFileSync(favoritesFilePath))
            : {};

        const userEmail = req.session.user.email;

        // Initialize favorites for the user if not present
        if (!allFavorites[userEmail]) {
            allFavorites[userEmail] = [];
        }

        // Check if the movie is already in the user's favorites
        const existingIndex = allFavorites[userEmail].findIndex(movie => movie.imdbID === imdbID);

        if (existingIndex !== -1) {
            // Remove the movie from favorites
            allFavorites[userEmail].splice(existingIndex, 1);
            fs.writeFileSync(favoritesFilePath, JSON.stringify(allFavorites, null, 2));
            return res.json({ success: true, message: "Removed from favorites", favorites: allFavorites[userEmail] });
        } else {
            // Add the movie to favorites
            allFavorites[userEmail].push({ imdbID, title, poster, year });
            fs.writeFileSync(favoritesFilePath, JSON.stringify(allFavorites, null, 2));
            return res.json({ success: true, message: "Added to favorites", favorites: allFavorites[userEmail] });
        }
    } catch (error) {
        console.error("Favorites operation error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.get("/favorites", authMiddleware, (req, res) => {
    try {
        const allFavorites = fs.existsSync(favoritesFilePath)
            ? JSON.parse(fs.readFileSync(favoritesFilePath))
            : {};

        const userEmail = req.session.user.email;
        const userFavorites = allFavorites[userEmail] || [];

        res.json({ success: true, favorites: userFavorites });
    } catch (error) {
        console.error("Error fetching favorites:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});