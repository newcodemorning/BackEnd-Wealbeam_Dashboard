const profileService = require('../services/profile.service');

exports.getProfile = async (req, res) => {
    try {
        const { role, roleId } = req.user;

        let profile;
        switch (role) {
            case 'school':
                profile = await profileService.getSchoolProfile(roleId);
                break;
            case 'teacher':
                profile = await profileService.getTeacherProfile(roleId);
                break;
            case 'student':
                profile = await profileService.getStudentProfile(roleId);
                break;
            case 'parent':
                profile = await profileService.getParentProfile(roleId);
                break;
            case 'super-admin':
                profile = await profileService.getSuperAdminProfile(roleId);
                break;
            default:
                return res.status(400).json({ message: 'Invalid role' });
        }

        res.json(profile);
    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
}; 