const pagination = (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100000000;
    const skip = (page - 1) * limit;

    console.log(`Pagination - Page: ${page}, Limit: ${limit}, Skip: ${skip}`);

    req.pagination = { page, limit, skip };
    next();
};

module.exports = pagination;


/*

  const { page, limit, skip } = req.pagination;
  
  const total = await Student.countDocuments({ class: classId });
  const totalPages = Math.ceil(total / limit);
  const currentPage = page;



    const students = await Student.find({ class: classId })
      .populate('user', 'email')
      .populate('class', '-students  -createdAt -updatedAt -__v')
      .populate('parent', '-students  -createdAt -updatedAt -__v')
      .skip(skip)
      .limit(limit);

      

  */