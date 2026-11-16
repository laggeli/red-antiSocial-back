const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nickName: { type: String, required: true, unique: true, trim: true },
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true, select: false },
})

const User = mongoose.model('User', userSchema);

module.exports = User;