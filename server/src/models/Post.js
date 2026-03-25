const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, default: '' }, // HTML from Quill
  image_url: { type: String, default: '' },
  author: { type: String, default: '' },
  slug: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);
