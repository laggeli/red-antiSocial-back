const setProfilePhotoPath = (req, res, next) => {
  if (req.file) { req.body.fotoPerfil = `/uploads/${req.file.filename}`; }

  next();
};

module.exports = setProfilePhotoPath;