const { db } = require('../config/firebase');

// Posts Collection Reference
const contactsCollection = db.collection('contacts_messages');

module.exports = {
  async createcontacts(data) {
    const postRef = await contactsCollection.add(data);
    return { id: postRef.id, ...data };
  },

  async fetchContactsMessages() {
      const snapshot = await db.collection('contacts_messages').get();
      if (snapshot.empty) return [];
  
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
  },
};
