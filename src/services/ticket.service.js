const Ticket = require('../models/ticket.model');
const { v4: uuidv4 } = require('uuid');
const { bucket } = require('../config/firebase'); // If you're uploading files to Firebase Storage

module.exports = {
  async createTicket(data, file) {
    try {
      let photoUrl = null;

      // Handle file upload if provided
      if (file) {
        const fileconten = bucket.file(`uploads/${file.originalname}`);
            await fileconten.save(file.buffer, {
              metadata: { contentType: file.mimetype },
            });
            await fileconten.makePublic();
        
            // Get the public URL of the uploaded file
            photoUrl = `https://storage.googleapis.com/${bucket.name}/${fileconten.name}`
       }

      // Create a new ticket document
      const ticket = new Ticket({
        ...data,
        fileUrl: photoUrl,
      });

      await ticket.save();
      return ticket;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  },

  async getTickets() {
    try {
      const tickets = await Ticket.find().sort({ createdAt: -1 });
      return tickets;
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
  },
};
