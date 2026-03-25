const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  role: { type: String, default: '' },
  company: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  image_url: { type: String, default: '' },
  bio: { type: String, default: '' }, // HTML from Quill
}, { timestamps: true });

module.exports = mongoose.model('TeamMember', TeamMemberSchema);
