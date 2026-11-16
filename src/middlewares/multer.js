const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ruta donde se van a guardar fisicamente las fotos
const uploadDirectory = path.join(__dirname, '../public/uploads');

// si la carpeta no existe, Node la crea automaticamente
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// configuracion de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    //agregamos la fecha exacta al nombre para que no haya archivos repetidos
    cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'));
  }
});

const upload = multer({ 
  storage, 
    limits: { fileSize: 5 * 1024 * 1024 }, // 5mb por archivo 
    fileFilter: (req, file, cb) => {
      const tiposPermitidos = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif'
      ];

      if (!tiposPermitidos.includes(file.mimetype)) { return cb(new Error('Solo se permiten archivos de imagen')); }

      cb(null, true);
    }
 });

// Middleware condicional para Multer, detecta si el Content-Type de la solicitud incluye multipart/form-data. Si es así, ejecuta Multer; de lo contrario, deja pasar la solicitud directamente para que los datos JSON sigan intactos hacia el validador Joi
const handleUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return upload.array('imagenes', 5)(req, res, (err) => {
      if (err) {
        // Si se excedió la cantidad de archivos (max = 5)
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
              error: 'Error de validación de imágenes',
              detalle: 'Se excedió el límite de imágenes permitidas (máximo 5).'
            });
          }
          return res.status(400).json({ error: 'Error al subir archivos', detalle: err.message });
        }
        // Otro tipo de error
        return res.status(400).json({ error: 'Error interno en la subida', detalle: err.message });
      }
      next();
    });
  }

  next();
};

module.exports = {
  upload,
  handleUpload
};