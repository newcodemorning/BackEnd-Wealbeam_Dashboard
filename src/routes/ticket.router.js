const express = require('express');
const ticketController = require('../controllers/ticket.controller');
const { validate } = require('../common/middleware/validation');
const { ticketSchema, updateTicketSchema } = require('../common/validations/ticket.validator');
const { authenticateUser, authorizeRole } = require('../common/middleware/auth');
const multer = require('multer');
const path = require('path');

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.use(authenticateUser, authorizeRole(["super-admin", "school", "teacher", "parent"]));
router.post('/open-ticket',validate(ticketSchema), upload.single('photo'), ticketController.createTicket);
router.get('/', ticketController.fetchTickets);

module.exports = router;
