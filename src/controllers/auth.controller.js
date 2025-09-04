const { Role } = require('../common/enums/role.enum');
// const { registerParentSchema } = require('../common/validations/register-parent.validation');
const { bucket } = require('../config/firebase');
const authService = require('../services/auth.service');

class AuthController {
  // async registerParent(req, res) {
  //   const { first_email,
  //     secound_email,
  //     gender,
  //     date_of_birth,
  //     password,
  //     first_name, last_name, first_phone, secound_phone } = req.body;
  //   try {

  //     const file = bucket.file(`uploads/${req.file?.originalname}`);
  //     await file.save(req.file.buffer, {
  //       metadata: { contentType: req.file.mimetype },
  //     });
  //     await file.makePublic();
  //     const fileUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`
  //     const parant = await authService.registerParent(req.body, fileUrl);

  //     await authService.assignRole(parant.id, 'parent');
  //     res.status(201).send({ message: 'parant registered successfully' });
  //   } catch (error) {
  //     res.status(500).send({ error: error.message });
  //   }
  // }

  async login(req, res) {
    const { email, password } = req.body;
    try {
      const { token, role, id, roleId } = await authService.login(email, password);
      res.status(200).send({ message: 'Login successful', id, role, roleId, token });
    } catch (error) {
      console.log(error);

      res.status(401).send({ error: error.message });
    }
  }



  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Validate request body
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Current password and new password are required' 
        });
      }

      // Get user ID from authenticated request
      const userId = req.user.id;

      const result = await authService.changePassword(userId, currentPassword, newPassword);
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AuthController();
