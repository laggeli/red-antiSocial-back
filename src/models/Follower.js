const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  followerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // toma a usuario x ref (A CHEQUEAR)
  followedId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

followSchema.index({ followerId: 1, followedId: 1 }, { unique: true });

const Follower = mongoose.model('Follower', followSchema);

module.exports = Follower;