const ticketService = require("../services/ticket.service");

module.exports = {
  // Create a new ticket with initial message
  async createTicket(req, res) {
    try {
      const { category, title, question } = req.body;
      const userId = req.user.id;
      const role = req.user.role;

      const ticket = await ticketService.createTicket({
        title,
        category,
        initialMessage: question,
        userId,
        role
      });

      res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        data: ticket
      });
    } catch (error) {
      console.error('Create ticket error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get all tickets (super-admin only)
  async getAllTickets(req, res) {
    try {
      const tickets = await ticketService.getAllTickets();

      res.status(200).json({
        success: true,
        data: tickets
      });
    } catch (error) {
      console.error('Get all tickets error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get user's own tickets
  async getMyTickets(req, res) {
    try {
      const userId = req.user.id;
      const tickets = await ticketService.getUserTickets(userId);

      res.status(200).json({
        success: true,
        data: tickets
      });
    } catch (error) {
      console.error('Get my tickets error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get single ticket with messages
  async getTicketById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const role = req.user.role;

      const ticket = await ticketService.getTicketById(id, userId, role);

      res.status(200).json({
        success: true,
        data: ticket
      });
    } catch (error) {
      console.error('Get ticket error:', error);
      res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Add reply to ticket
  async addReply(req, res) {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const userId = req.user.id;
      const role = req.user.role;

      const reply = await ticketService.addReply(id, userId, role, message);

      res.status(201).json({
        success: true,
        message: 'Reply added successfully',
        data: reply
      });
    } catch (error) {
      console.error('Add reply error:', error);
      res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Update ticket status (super-admin only)
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const ticket = await ticketService.updateTicketStatus(id, status);

      res.status(200).json({
        success: true,
        message: 'Ticket status updated',
        data: ticket
      });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Update ticket priority (super-admin only)
  async updatePriority(req, res) {
    try {
      const { id } = req.params;
      const { priority } = req.body;

      const ticket = await ticketService.updateTicketPriority(id, priority);

      res.status(200).json({
        success: true,
        message: 'Ticket priority updated',
        data: ticket
      });
    } catch (error) {
      console.error('Update priority error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Close ticket
  async closeTicket(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const role = req.user.role;

      let ticket;
      if (role === 'super-admin') {
        ticket = await ticketService.updateTicketStatus(id, 'closed');
      } else {
        ticket = await ticketService.closeTicket(id, userId);
      }

      res.status(200).json({
        success: true,
        message: 'Ticket closed successfully',
        data: ticket
      });
    } catch (error) {
      console.error('Close ticket error:', error);
      res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
        success: false,
        message: error.message
      });
    }
  }
};
