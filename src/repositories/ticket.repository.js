const { db } = require('../config/firebase');

// Posts Collection Reference
const collection = db.collection('tickets');

module.exports = {
  async createticket(data) {
    const postRef = await collection.add(data);
    return { id: postRef.id, ...data };
  },

  async getTickets() {
    const snapshot = await collection.get();
    if (snapshot.empty) return [];

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  }
};
