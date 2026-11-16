const mongoose = require('mongoose');
const { getCommentVisibilityLimit } = require('../utils/commentVisibility');

const commentSchema = new mongoose.Schema({
  contenido: { type: String, required: true, trim: true, minlength: 1, maxlength: 500 },
  comentadoEn: { type: Date, default: Date.now, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, //1:N -> MUCHOS comments pueden pertenecer a 1 user
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true }, //1:N -> MUCHOS comments pueden pertenecer a 1 post
}, { versionKey: false });

//campo virtual: para la visibilidad del comentario, se calcula, no se agrega en la BD.
commentSchema.virtual("esVisible").get(function() {
  if (!this.comentadoEn) return false; //si no tiene fecha de comentario, no se muestra
  return this.comentadoEn >= getCommentVisibilityLimit();
});

module.exports = mongoose.model("Comment", commentSchema);