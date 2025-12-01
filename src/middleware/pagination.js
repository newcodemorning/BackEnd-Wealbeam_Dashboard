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
            if (req.query[f] !== undefined) filter[f] = req.query[f];
        });

        req.pagination = { page, limit, skip, sort, filter };
        next();
    };
};

module.exports = pagination;
