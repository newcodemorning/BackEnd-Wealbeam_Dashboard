const { Ticket, TicketMessage } = require('../models/ticket.model');
const User = require('../models/user.model');
const Parent = require('../models/parent.model');
const Student = require('../models/student.model');
const Teacher = require('../models/teacher.model');
const School = require('../models/school.model');

// Get user details by role
const getUserDetails = async (userId, role) => {
  if (!userId) return null;

  let details = null;
  try {
    switch (role) {
      case 'parent':
        details = await Parent.findOne({ user: userId }).select('first_name last_name');
        break;
      case 'student':
        details = await Student.findOne({ user: userId }).select('first_name last_name');
        break;
      case 'teacher':
        details = await Teacher.findOne({ user: userId }).select('first_name last_name');
        break;
      case 'school':
        details = await School.findOne({ user: userId }).select('schoolName');
        break;
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
  }
  return details;
};

// Helper to safely get userId from populated or unpopulated field
const getUserId = (userField) => {
  if (!userField) return null;
  // If populated, it's an object with _id
  if (userField._id) return userField._id;
  // If not populated, it's the ObjectId directly
  return userField;
};

module.exports = {
  // Create a new ticket with initial message
  async createTicket(data) {
    try {
      const { title, category, initialMessage, userId, role } = data;

      // Create the ticket
      const ticket = new Ticket({
        title,
        category,
        createdBy: {
          userId,
          role
        },
        priority: 'medium',
        status: 'open'
      });

      const savedTicket = await ticket.save();

      // Create the initial message
      const message = new TicketMessage({
        ticketId: savedTicket._id,
        sender: {
          userId,
          role
        },
        message: initialMessage
      });

      await message.save();

      return savedTicket;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  },

  // Get all tickets (super-admin only)
  async getAllTickets() {
    try {
      const tickets = await Ticket.find()
        .populate('createdBy.userId', 'email')
        .sort({ lastMessageAt: -1 })
        .lean();

      // Get messages for each ticket
      const ticketsWithMessages = await Promise.all(
        tickets.map(async (ticket) => {
          const messages = await TicketMessage.find({ ticketId: ticket._id })
            .populate('sender.userId', 'email')
            .sort({ createdAt: 1 })
            .lean();

          // Get user details - safely extract userId
          let userDetails = null;
          if (ticket.createdBy) {
            const userId = getUserId(ticket.createdBy.userId);
            if (userId) {
              userDetails = await getUserDetails(userId, ticket.createdBy.role);
            }
          }

          return {
            ...ticket,
            createdByDetails: userDetails,
            messages,
            messageCount: messages.length
          };
        })
      );

      return ticketsWithMessages;
    } catch (error) {
      console.error('Error fetching all tickets:', error);
      throw error;
    }
  },

  // Get tickets for a specific user
  async getUserTickets(userId) {
    try {
      const tickets = await Ticket.find({ 'createdBy.userId': userId })
        .populate('createdBy.userId', 'email')
        .sort({ lastMessageAt: -1 })
        .lean();

      // Get messages for each ticket
      const ticketsWithMessages = await Promise.all(
        tickets.map(async (ticket) => {
          const messages = await TicketMessage.find({ ticketId: ticket._id })
            .populate('sender.userId', 'email')
            .sort({ createdAt: 1 })
            .lean();

          // Safely calculate unread count
          const unreadCount = messages.filter(m => {
            if (m.isRead) return false;
            const senderUserId = getUserId(m.sender?.userId);
            return senderUserId && senderUserId.toString() !== userId;
          }).length;

          return {
            ...ticket,
            messages,
            messageCount: messages.length,
            unreadCount
          };
        })
      );

      return ticketsWithMessages;
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      throw error;
    }
  },

  // Get single ticket with messages
  async getTicketById(ticketId, userId, role) {
    try {
      const ticket = await Ticket.findById(ticketId)
        .populate('createdBy.userId', 'email')
        .lean();

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Safely get ticket owner ID
      const ticketOwnerId = getUserId(ticket.createdBy?.userId);

      // Check access - super-admin can view all, users can only view their own
      if (role !== 'super-admin') {
        if (!ticketOwnerId || ticketOwnerId.toString() !== userId) {
          throw new Error('Unauthorized to view this ticket');
        }
      }

      // Get messages
      const messages = await TicketMessage.find({ ticketId })
        .populate('sender.userId', 'email')
        .sort({ createdAt: 1 })
        .lean();

      // Get user details safely
      let userDetails = null;
      if (ticket.createdBy && ticketOwnerId) {
        userDetails = await getUserDetails(ticketOwnerId, ticket.createdBy.role);
      }

      // Mark messages as read for the current user
      await TicketMessage.updateMany(
        {
          ticketId,
          'sender.userId': { $ne: userId },
          isRead: false
        },
        { isRead: true }
      );

      return {
        ...ticket,
        createdByDetails: userDetails,
        messages
      };
    } catch (error) {
      console.error('Error fetching ticket:', error);
      throw error;
    }
  },

  // Add reply to ticket
  async addReply(ticketId, userId, role, messageText) {
    try {
      const ticket = await Ticket.findById(ticketId);

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Check if ticket is closed
      if (ticket.status === 'closed') {
        throw new Error('Cannot reply to a closed ticket');
      }

      // Safely get ticket owner ID
      const ticketOwnerId = getUserId(ticket.createdBy?.userId);

      // Check access - super-admin can reply to all, users can only reply to their own
      if (role !== 'super-admin') {
        if (!ticketOwnerId || ticketOwnerId.toString() !== userId) {
          throw new Error('Unauthorized to reply to this ticket');
        }
      }

      // Create message
      const message = new TicketMessage({
        ticketId,
        sender: {
          userId,
          role
        },
        message: messageText
      });

      await message.save();

      // Update ticket's lastMessageAt
      ticket.lastMessageAt = new Date();
      await ticket.save();

      return await TicketMessage.findById(message._id)
        .populate('sender.userId', 'email')
        .lean();
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  },

  // Update ticket status (super-admin only)
  async updateTicketStatus(ticketId, status) {
    try {
      const ticket = await Ticket.findById(ticketId);

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      ticket.status = status;
      if (status === 'closed') {
        ticket.closedAt = new Date();
      }

      await ticket.save();
      return ticket;
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw error;
    }
  },

  // Update ticket priority (super-admin only)
  async updateTicketPriority(ticketId, priority) {
    try {
      const ticket = await Ticket.findById(ticketId);

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      ticket.priority = priority;
      await ticket.save();
      return ticket;
    } catch (error) {
      console.error('Error updating ticket priority:', error);
      throw error;
    }
  },

  // Close user's own ticket
  async closeTicket(ticketId, userId) {
    try {
      const ticket = await Ticket.findById(ticketId);

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Safely get ticket owner ID
      const ticketOwnerId = getUserId(ticket.createdBy?.userId);

      if (!ticketOwnerId || ticketOwnerId.toString() !== userId) {
        throw new Error('Unauthorized to close this ticket');
      }

      ticket.status = 'closed';
      ticket.closedAt = new Date();
      await ticket.save();

      return ticket;
    } catch (error) {
      console.error('Error closing ticket:', error);
      throw error;
    }
  }
};
