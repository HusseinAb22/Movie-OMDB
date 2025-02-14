const mongoose = require("mongoose");

const FavoriteMovieSchema = new mongoose.Schema({
    imdbID: { type: String, required: true },
    title: { type: String, required: true },
    poster: { type: String, required: true },
    year: { type: String, required: true }
});

const UserFavoritesSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    favorites: { type: [FavoriteMovieSchema], default: [] }
});

const UserFavorites = mongoose.model("UserFavorites", UserFavoritesSchema);

module.exports = UserFavorites;