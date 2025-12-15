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

                    // For PDFs, search in title (multilingual), description, and fileName
                    filter.$or = [
                        { 'title.en': re },
                        { 'title.ar': re },
                        { 'description.en': re },
                        { 'description.ar': re },
                        { fileName: re },
                        { supportedLanguages: re }
                    ];
                }
            } else if (f === 'isVisible' && req.query.isVisible !== undefined) {
                filter.isVisible = req.query.isVisible === 'true';
            } else if (f === 'isPublic' && req.query.isPublic !== undefined) {
                filter.isPublic = req.query.isPublic === 'true';
            } else if (f === 'uploadedBy' && req.query.uploadedBy) {
                filter.uploadedBy = req.query.uploadedBy;
            } else if (f === 'targetSchools' && req.query.targetSchools) {
                filter.targetSchools = { $in: req.query.targetSchools.split(',') };
            } else if (f === 'supportedLanguages' && req.query.supportedLanguages) {
                filter.supportedLanguages = { $in: req.query.supportedLanguages.split(',') };
            } else {
                if (req.query[f] !== undefined) {
                    filter[f] = req.query[f];
                }
            }
        });

        req.pagination = { page, limit, skip, sort, filter };
        next();
    };
};

module.exports = pagination;
