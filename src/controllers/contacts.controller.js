const contactsService = require('../services/contacts.service');

module.exports = {
  async createcontacts(req, res) {
    try {
      const post = await contactsService.createContact(req.body);
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  
  async getAll(req, res) {
    try {
      const faqs = await contactsService.fetchContactsMessages();
      res.status(200).json({
        message: 'contacts fetched successfully',
        data: faqs,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
