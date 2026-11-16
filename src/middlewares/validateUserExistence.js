const User = require('../models/User');

const validateUserExistence = async (req, res, next) => { // verifica que el usuario exista
  try {
    const { nickName } = req.params;
    const user = await User.findOne({ nickName });

    if (!user) { return res.status(404).json({ message: "Usuario no encontrado" }); }

    req.user = user;
    next();
  } catch (error) { res.status(500).json({ message: "Error al verificar el usuario" }); }
};

module.exports = validateUserExistence;