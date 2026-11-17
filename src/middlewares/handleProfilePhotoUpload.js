const multer = require('multer');
const { upload } = require('./multer');

const handleProfilePhotoUpload = (req, res, next) => {
  upload.single('fotoPerfil')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        error: 'Error al subir la foto de perfil',
        detalle: error.message,
      });
    }

    if (error) {
      return res.status(400).json({
        error: 'No se pudo procesar la foto de perfil',
        detalle: error.message,
      });
    }

    next();
  });
};

module.exports = handleProfilePhotoUpload;