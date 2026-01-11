import mongoose from "mongoose";

const TicketMessageSchema = new mongoose.Schema(
    {
        ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },

        sender: {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            role: {
                type: String,
                enum: ["parent", "student", "teacher", "school", "super-admin"],
                required: true
            }
        },

        message: { type: String, required: true },



        isRead: { type: Boolean, default: false }
    },
    { timestamps: true }
);

export default mongoose.model("TicketMessage", TicketMessageSchema);
