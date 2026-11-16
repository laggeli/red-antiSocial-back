const mongoose = require('mongoose');

const postImageSchema = new mongoose.Schema({
  url: { type: String, required: true }
});

const postSchema = new mongoose.Schema({
  descripcion: { type: String, required: true, trim: true },
  publicadoEn: { type: Date, default: Date.now, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, //1:N -> MUCHOS post pueden pertenecer a 1 user
  tagIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }], //N:M -> array de ObjectId apuntando a Tag - MUCHOS tags pueden pertenercer a MUCHOS posts
  imagenes: [postImageSchema] //INCRUSTACIÓN -> array de subdocumentos con las fotos
}, { versionKey: false });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;