const mongoose = require('mongoose');

const FaqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  slug: { type: String, required: true },
  answer: { type: String, default: '' }, // HTML from Quill
}, { timestamps: true });

module.exports = mongoose.model('Faq', FaqSchema);
