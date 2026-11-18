const swaggerUi = require("swagger-ui-express"); 
const YAML = require("yamljs"); 
const swaggerDocument = YAML.load("./swagger.yaml");
const { conectarDB } = require('./config/db');
const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const { conectarRedis } = require('./config/redis');

const PORT = process.env.PORT || 3000;

// rutas
const userRoutes = require('./routes/userRoutes');
const tagRoutes = require('./routes/tagRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');

const origenesPermitidos = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({origin: (origin, callback) => {
      // permite herramientas como Postman y solicitudes sin origin.
      if (!origin || origenesPermitidos.includes(origin)) { return callback(null, true); }
      return callback(new Error("Origen no permitido por CORS"));
    },
  })
);

app.use(express.json());

const path = require('path');
// permite acceder a los archivos guardados en src/public
app.use(express.static(path.join(__dirname, 'public')));

// use
app.use('/users', userRoutes);
app.use('/tags', tagRoutes);
app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);

// ruta principal
app.get('/', (req, res) => {
    res.status(200).json({
        message: "Bienvenido a Red Anti-Social",
        swagger: `${process.env.BASE_URL}/api-docs`,
        mongoExpress: 'http://localhost:8081'
    });
});

// Ruta interactiva de Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 404 ruta no encontrada
app.use((req, res, next) => {
    return res.status(404).json({
        error: 'Ruta no encontrada',
        message: `La ruta ${req.originalUrl} no existe en este servidor`
    });
});

// 500 manejador global de errores
app.use((err, req, res, next) => {
    console.error('Error no controlado:', err.stack);
    return res.status(err.status || 500).json({
        error: 'Error interno del servidor',
        message: err.message || 'Ocurrió un fallo inesperado en el servidor'
    });
});

// aca conecta el redis y la base de datos
const iniciarServidor = async () => {
  try {
    await conectarDB();
    await conectarRedis();
    app.listen(PORT, () => { console.log(`API corriendo en http://localhost:${PORT}`); });
  } catch (error) {
      console.error("No se pudo iniciar el servidor:", error.message);
      process.exit(1);
    }
}

iniciarServidor();