const validateNotSelfFollow = (req, res, next) => { // verifica que un usuario no se pueda seguir a el mismo
  if (req.follower._id.equals(req.followed._id)) {
    return res.status(400).json({ message: "No podes seguirte a vos mismo" });
  }

  next();
};

module.exports = validateNotSelfFollow;