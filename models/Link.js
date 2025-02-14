const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now }
});

const linkSchema = new mongoose.Schema({
    movieId: {
        type: String, 
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    clicks: {
        type: Number,
        default: 0
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^https?:\/\/.+/.test(v);
            },
            message: 'URL must start with http:// or https://'
        }
    },
    description: {
        type: String,
        trim: true
    },
    isPublic: { type: Boolean, default: true },
    reviews: [reviewSchema],
    averageRating: { type: Number, default: 0 },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});


linkSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Link = mongoose.model('Link', linkSchema);

module.exports = Link; 