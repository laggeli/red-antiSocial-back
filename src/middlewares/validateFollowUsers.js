const User  = require('../models/User');

const validateFollowUsers = async (req, res, next) => { // verifica q ambos usuarios existan al momento de uno seguir al otro
  try {
    const { nickName, followedNickName } = req.params;
    const follower = await User.findOne({ nickName });
    const followed = await User.findOne({ nickName: followedNickName });

    if (!follower || !followed) { return res.status(404).json({ message: "Uno o ambos usuarios no fueron encontrados" }); }

    req.follower = follower;
    req.followed = followed;

    next();
  } catch (error) { res.status(500).json({ message: "Error al verificar los usuarios" }); }
};

module.exports = validateFollowUsers;