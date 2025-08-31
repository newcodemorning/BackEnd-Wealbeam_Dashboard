const superAdminService = require('../services/super-admin.service');

const createSuperAdmin = async (req, res) => {
    try {
        const superAdmin = await superAdminService.createSuperAdmin(req.body);
        res.status(201).json(superAdmin);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get Super Admin by ID
const getSuperAdmin = async (req, res) => {
    let lang = req.lang || 'en';
    try {
        let superAdmin = await superAdminService.getSuperAdminById(req.params.id);

        if (!superAdmin) {
            return res.status(404).json({ message: 'Super Admin not found' });
        }
        superAdmin = superAdmin.toObject ? superAdmin.toObject() : superAdmin;
        if (superAdmin.firstName && typeof superAdmin.firstName === 'object') {
            superAdmin.firstName = superAdmin.firstName[lang] || superAdmin.firstName.en || superAdmin.firstName.ar;
        }
        if (superAdmin.lastName && typeof superAdmin.lastName === 'object') {
            superAdmin.lastName = superAdmin.lastName[lang] || superAdmin.lastName.en || superAdmin.lastName.ar;
        }

        res.status(200).json(superAdmin);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Super Admin personal information
const updateSuperAdmin = async (req, res) => {
    try {
        const file = req?.file;
        const superAdmin = await superAdminService.updateSuperAdmin(req.params.id, req.body, file);
        if (!superAdmin) {
            return res.status(404).json({ message: 'Super Admin not found' });
        }
        res.status(200).json(superAdmin);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Change Super Admin password
const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const superAdmin = await superAdminService.changePassword(req.params.id, oldPassword, newPassword);
        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createSuperAdmin,
    getSuperAdmin,
    updateSuperAdmin,
    changePassword,
};