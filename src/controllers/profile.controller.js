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

exports.updateProfile = async (req, res) => {
    try {
        const { role, roleId } = req.user;
        const updateData = req.body;
        const file = req.file; // Get uploaded file



        let updatedProfile;
        switch (role) {
            case 'student':
                updatedProfile = await profileService.updateStudentProfile(roleId, updateData, file);
                break;
            case 'school':
                res.status(501).json({ message: 'School profile update not implemented yet' });
                // updatedProfile = await profileService.updateSchoolProfile(roleId, updateData);
                break;
            case 'teacher':
                res.status(501).json({ message: 'Teacher profile update not implemented yet' });
                // updatedProfile = await profileService.updateTeacherProfile(roleId, updateData);
                break;
            case 'parent':
                res.status(501).json({ message: 'Parent profile update not implemented yet' });
                // updatedProfile = await profileService.updateParentProfile(roleId, updateData);
                break;
            case 'super-admin':
                res.status(501).json({ message: 'Super Admin profile update not implemented yet' });
                // updatedProfile = await profileService.updateSuperAdminProfile(roleId, updateData);
                break;
            default:
                return res.status(400).json({ message: 'Invalid role' });
        }

        res.json(updatedProfile);
    } catch (error) {
        console.error('Error in updateProfile:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};