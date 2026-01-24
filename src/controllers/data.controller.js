const dataService = require('../services/data.service');

async function GetSchoolsFilter(req, res) {
    try {
        const schools = await dataService.getSchoolsWithClasses(req);
        res.status(200).json({ success: true, data: schools });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function GetSchoolsStudentsFilter(req, res) {
    try {
        const schools = await dataService.getSchoolStudnts(req);
        res.status(200).json({ success: true, data: schools });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    GetSchoolsStudentsFilter,
    GetSchoolsFilter
};
