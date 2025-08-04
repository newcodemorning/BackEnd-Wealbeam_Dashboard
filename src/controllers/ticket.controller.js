const { bucket } = require('../config/firebase');
const ticketService = require('../services/ticket.service');

module.exports = {
  async createTicket(req, res) {
    const { category,
      title,
      question } = req.body;
    try {
      const ticket = await ticketService.createTicket(
        {
          category,
          title,
          question,
        }, req?.file)
      res.status(201).json(ticket);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },


  async fetchTickets(req, res) {
    try {
      const tickets = await ticketService.getTickets();
      res.status(200).json(tickets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
