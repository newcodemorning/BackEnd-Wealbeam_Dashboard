const express = require('express');
const ticketController = require('../controllers/ticket.controller');
const { validate } = require('../common/middleware/validation');
const { ticketSchema, replySchema, updateStatusSchema, updatePrioritySchema } = require('../common/validations/ticket.validator');
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');
const multer = require('multer');
const path = require('path');

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// All routes require authentication
router.use(authenticateUser);

// User routes - accessible by all authenticated users
router.post(
    '/open-ticket',
    authorizeRole(["super-admin", "school", "teacher", "student", "parent"]),
    validate(ticketSchema),
    ticketController.createTicket
);

router.get(
    '/my-tickets',
    authorizeRole(["school", "teacher", "parent", "student"]),
    ticketController.getMyTickets
);

router.get(
    '/:id',
    authorizeRole(["super-admin", "school", "teacher", "parent", "student"]),
    ticketController.getTicketById
);

router.post(
    '/:id/reply',
    authorizeRole(["super-admin", "school", "teacher", "parent", "student"]),
    validate(replySchema),
    ticketController.addReply
);

router.patch(
    '/:id/close',
    authorizeRole(["super-admin", "school", "teacher", "parent"]),
    ticketController.closeTicket
);

// Super-admin only routes
router.get(
    '/',
    authorizeRole(["super-admin"]),
    ticketController.getAllTickets
);

router.patch(
    '/:id/status',
    authorizeRole(["super-admin"]),
    validate(updateStatusSchema),
    ticketController.updateStatus
);

router.patch(
    '/:id/priority',
    authorizeRole(["super-admin"]),
    validate(updatePrioritySchema),
    ticketController.updatePriority
);

module.exports = router;
