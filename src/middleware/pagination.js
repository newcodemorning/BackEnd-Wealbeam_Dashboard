const pagination = ({ defaultLimit = 5, maxLimit = 50, allowedFilters = [] } = {}) => {
    return (req, res, next) => {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || defaultLimit;
        if (limit > maxLimit) limit = maxLimit;
        const skip = (page - 1) * limit;

        let sort = {};
        if (req.query.sort) {
            const [field, order] = req.query.sort.split(':');
            sort[field] = order === 'desc' ? -1 : 1;
        } else {
            sort.createdAt = -1;
        }

        const filter = {};

        allowedFilters.forEach(f => {
            // Search filter - special handling
            if (f === 'search' && req.query.search !== undefined) {
                const raw = String(req.query.search || '').trim();
                if (raw.length > 0) {
                    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const re = new RegExp(escapeRegex(raw), 'i');
                    filter.$search = raw;
                    filter.$searchRegex = re;
                }
            }
            // Boolean filters - explicit true/false handling
            else if (f === 'isVisible' && req.query.isVisible !== undefined) {
                const value = req.query.isVisible;
                filter.isVisible = value === 'true' || value === true;
            }
            else if (f === 'isPublic' && req.query.isPublic !== undefined) {
                const value = req.query.isPublic;
                filter.isPublic = value === 'true' || value === true;
            }
            else if (f === 'isFeatured' && req.query.isFeatured !== undefined) {
                const value = req.query.isFeatured;
                filter.isFeatured = value === 'true' || value === true;
            }
            else if (f === 'isPinned' && req.query.isPinned !== undefined) {
                const value = req.query.isPinned;
                filter.isPinned = value === 'true' || value === true;
            }
            // Array filters - split by comma and filter empty values
            else if (f === 'targetSchools' && req.query.targetSchools) {
                const schools = req.query.targetSchools.split(',').map(s => s.trim()).filter(Boolean);
                if (schools.length > 0) {
                    filter.targetSchools = { $in: schools };
                }
            }
            else if (f === 'supportedLanguages' && req.query.supportedLanguages) {
                const langs = req.query.supportedLanguages.split(',').map(l => l.trim()).filter(Boolean);
                if (langs.length > 0) {
                    filter.supportedLanguages = { $in: langs };
                }
            }
            else if (f === 'allowedSchools' && req.query.allowedSchools) {
                const schools = req.query.allowedSchools.split(',').map(s => s.trim()).filter(Boolean);
                if (schools.length > 0) {
                    filter.allowedSchools = { $in: schools };
                }
            }
            // String filters
            else if (f === 'uploadedBy' && req.query.uploadedBy) {
                filter.uploadedBy = req.query.uploadedBy.trim();
            }
            else if (f === 'category' && req.query.category) {
                filter.category = req.query.category.trim();
            }
            else if (f === 'author' && req.query.author) {
                filter.author = req.query.author.trim();
            }
            else if (f === 'visibility' && req.query.visibility) {
                const visibility = req.query.visibility.trim();
                if (['public', 'private', 'both'].includes(visibility)) {
                    filter.visibility = visibility;
                }
            }
            else if (f === 'status' && req.query.status) {
                const status = req.query.status.trim();
                if (['draft', 'published'].includes(status)) {
                    filter.status = status;
                }
            }
            // Generic filter - for any other allowed filters
            else if (req.query[f] !== undefined && req.query[f] !== '') {
                filter[f] = req.query[f];
            }
        });

        // Log applied filters for debugging
        if (Object.keys(filter).length > 0) {
            console.log('[Pagination] Applied filters:', JSON.stringify(filter, null, 2));
        }

        req.pagination = { page, limit, skip, sort, filter };
        next();
    };
};

module.exports = pagination;
