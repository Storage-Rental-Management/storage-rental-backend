const Meeting = require('../../models/meeting');

module.exports = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            status,
            organizerId,
            attendeeId,
            search,
            sortBy = 'scheduledFor',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};
        
        if (status) query.status = status;
        if (organizerId) query.organizerId = organizerId;
        if (attendeeId) query.attendeeId = attendeeId;
        
        // Search in title and description
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate skip value for pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query with pagination and sorting
        const meetings = await Meeting.find(query)
            .populate('organizerId', 'username email')
            .populate('attendeeId', 'username email')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Meeting.countDocuments(query);

        return res.success({
            data: meetings,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching meetings:', error);
        return res.internalServerError({
            message: 'Failed to fetch meetings',
            error: error.message
        });
    }
}; 