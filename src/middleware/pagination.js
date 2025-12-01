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

                     filter.$or = [
                        { 'title.en': re },
                        { 'title.ar': re },
                        { 'content.en': re },
                        { 'content.ar': re },
                        { tags: re },
                        { category: re },
                        { subcategory: re },
                        { slug: re },
                    ];
                }
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
