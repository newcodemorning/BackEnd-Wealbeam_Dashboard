const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        category: {
            type: String,
            enum: ["academic", "financial", "behavior", "technical", "other"],
            default: "other"
        },
        status: { type: String, enum: ["open", "pending", "closed"], default: "open" },
        priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
        createdBy: {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            role: { type: String, enum: ["parent", "student", "teacher", "school"], required: true }
        },
        lastMessageAt: { type: Date, default: Date.now },
        closedAt: { type: Date, default: null }
    },
    { timestamps: true }
);

const TicketMessageSchema = new mongoose.Schema(
    {
        ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
        sender: {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            role: { type: String, enum: ["parent", "student", "teacher", "school", "super-admin"], required: true }
        },
        message: { type: String, required: true },
        isRead: { type: Boolean, default: false }
    },
    { timestamps: true }
);

const Ticket = mongoose.model("Ticket", TicketSchema);
const TicketMessage = mongoose.model("TicketMessage", TicketMessageSchema);

module.exports = { Ticket, TicketMessage };

