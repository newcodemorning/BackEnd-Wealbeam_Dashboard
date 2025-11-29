const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const LocalizedString = {
    en: { type: String, trim: true, default: "" },
    ar: { type: String, trim: true, default: "" }
};

const BlogSchema = new mongoose.Schema(
    {
        title: { type: LocalizedString, required: true },
        content: { type: LocalizedString, required: true },
        cover: { type: String, required: true },
        images: [{ type: String }],
        slug: { type: String, unique: true, required: true },
        tags: [{ type: String }],
        category: { type: String, default: "" },
        subcategory: { type: String, default: "" },
        attachments: [{ type: String }],
        author: { type: Schema.Types.ObjectId, ref: "User", required: true },
        visibility: {
            type: String,
            enum: ["public", "private", "both"],
            default: "public",
        },
        allowedSchools: [{ type: String }],
        status: {
            type: String,
            enum: ["draft", "published"],
            default: "draft",
        },
        viewCount: { type: Number, default: 0 },
        isFeatured: { type: Boolean, default: false },
        isPinned: { type: Boolean, default: false },
    },
    { timestamps: true }
);


const Blog = mongoose.model("Blog", BlogSchema);
module.exports = Blog;
