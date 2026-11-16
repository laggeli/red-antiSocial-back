const mongoose = require('mongoose');

const conectarDB = async () => {
    const environment = process.env.NODE_ENV || 'development';
    const mongoURIs = {
      development: process.env.MONGO_URI_DEV,
      test: process.env.MONGO_URI_TEST,
      production: process.env.MONGO_URI_PROD
    };

    const mongoURI = process.env.MONGO_URI || mongoURIs[environment];

    if (!mongoURI) { throw new Error(`No se encontró una URI para el entorno: ${environment}`); }

    await mongoose.connect(mongoURI);

    console.log(`MongoDB conectado en modo: [${environment}]`);
};

module.exports = { conectarDB };