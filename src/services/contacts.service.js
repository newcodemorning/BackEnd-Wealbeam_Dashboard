const Contact = require('../models/contact.model');

module.exports = {
  async createContact(data) {
    // Ensure you pass an object to the model constructor
    if (typeof data !== 'object') {
      throw new Error('Data must be an object');
    }
    const contact = new Contact(data); // Create an instance
    const savedContact = await contact.save(); // Save to MongoDB
    return savedContact.toObject(); // Convert to plain JavaScript object
  },

  async fetchContactsMessages() {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    return contacts.map(contact => contact.toObject());
  },
};
