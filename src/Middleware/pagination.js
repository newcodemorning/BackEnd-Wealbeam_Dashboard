const pagination = (req, res, next) => {
    const page = parseInt(req.query.page) || 1;    
    const limit = parseInt(req.query.limit) || 100000000;
    const skip = (page - 1) * limit;

    console.log(`Pagination - Page: ${page}, Limit: ${limit}, Skip: ${skip}`);

    req.pagination = { page, limit, skip };
    next();
};

module.exports = pagination;
