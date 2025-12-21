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
            if (f === 'search' && req.query.search !== undefined) {
                const raw = String(req.query.search || '').trim();
                if (raw.length > 0) {
                    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const re = new RegExp(escapeRegex(raw), 'i');

                    // Store search term for service to handle
                    filter.$search = raw;
                    filter.$searchRegex = re;
                }
            } else if (f === 'isVisible' && req.query.isVisible !== undefined) {
                filter.isVisible = req.query.isVisible === 'true';
            } else if (f === 'isPublic' && req.query.isPublic !== undefined) {
                filter.isPublic = req.query.isPublic === 'true';
            } else if (f === 'uploadedBy' && req.query.uploadedBy) {
                filter.uploadedBy = req.query.uploadedBy;
            } else if (f === 'targetSchools' && req.query.targetSchools) {
                const schools = req.query.targetSchools.split(',').map(s => s.trim()).filter(Boolean);
                if (schools.length > 0) {
                    filter.targetSchools = { $in: schools };
                }
            } else if (f === 'supportedLanguages' && req.query.supportedLanguages) {
                const langs = req.query.supportedLanguages.split(',').map(l => l.trim()).filter(Boolean);
                if (langs.length > 0) {
                    filter.supportedLanguages = { $in: langs };
                }
            } else if (f === 'category' && req.query.category) {
                filter.category = req.query.category;
            } else if (f === 'author' && req.query.author) {
                filter.author = req.query.author;
            } else if (f === 'visibility' && req.query.visibility) {
                filter.visibility = req.query.visibility;
            } else {
                if (req.query[f] !== undefined && req.query[f] !== '') {
                    filter[f] = req.query[f];
                }
            }
        });

        req.pagination = { page, limit, skip, sort, filter };
        next();
    };
};

module.exports = pagination;
