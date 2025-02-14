const express = require('express');
const router = express.Router();
const Link = require('../models/Link');
const User = require('../models/User');

// Admin middleware
const isAdmin = async (req, res, next) => {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.status(401).json({ success: false, message: "Unauthorized - Admin access required" });
    }
    next();
};

// Get all links with pagination
router.get('/links', isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const links = await Link.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    _id: 1,
                    movieId: 1,
                    username: '$user.firstName',
                    name: 1,
                    url: 1,
                    clicks: 1,
                    description: 1,
                    isPublic: 1,
                    createdAt: 1,
                    reviews: 1,
                    averageRating: 1
                }
            },
            {
                $sort: { averageRating: -1, clicks: -1 }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);

        const total = await Link.countDocuments();
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            links,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error('Error fetching links:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching links' 
        });
    }
});

// Delete a link
router.delete('/links/:id', isAdmin, async (req, res) => {
    try {
        await Link.findByIdAndDelete(req.params.id);
        res.json({ message: 'Link deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting link' });
    }
});

// Add link for specific movie
router.post('/:movieId/links', isAdmin, async (req, res) => {
    try {
        const { movieId } = req.params;
        const { name, url, isPublic } = req.body;
        const userId = req.session.user._id;

        const newLink = new Link({
            movieId,
            userId,
            name,
            url,
            isPublic,
            clicks: 0,
            reviews: []
        });

        await newLink.save();
        res.json({ success: true, link: newLink });
    } catch (error) {
        console.error('Error adding link:', error);
        res.status(500).json({ success: false, message: 'Error adding link' });
    }
});

// Get all links for specific movie
router.get('/:movieId/links', isAdmin, async (req, res) => {
    try {
        const { movieId } = req.params;
        const links = await Link.find({ movieId })
            .populate('userId', 'firstName')
            .sort({ clicks: -1 });

        res.json({
            success: true,
            links: links.map(link => ({
                _id: link._id,
                movieId: link.movieId,
                username: link.userId ? link.userId.firstName : 'Unknown',
                name: link.name,
                url: link.url,
                clicks: link.clicks,
                isPublic: link.isPublic,
                createdAt: link.createdAt,
                averageRating: link.averageRating
            }))
        });
    } catch (error) {
        console.error('Error fetching movie links:', error);
        res.status(500).json({ success: false, message: 'Error fetching links' });
    }
});

module.exports = router; 