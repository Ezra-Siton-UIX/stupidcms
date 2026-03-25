const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String, required: true },
  db_name: { type: String, required: true }, // which client database this user manages
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
