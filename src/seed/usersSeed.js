require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const usuariosDemo = [
  {
    nickName: "ichigo",
    nombre: "Ichigo Kurosaki",
    email: "ichigo@gmail.com",
    contraseña: "123456",
  },
  {
    nickName: "rukiaa",
    nombre: "Rukia",
    email: "rukia@gmail.com",
    contraseña: "123456",
  },
];

const crearUsuariosDemo = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI_DEV || process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error(
        "No se encontró MONGO_URI_DEV en el archivo .env"
      );
    }

    await mongoose.connect(mongoURI);

    console.log("Conectado a MongoDB.");

    for (const usuario of usuariosDemo) {
      const existente = await User.findOne({
        nickName: usuario.nickName,
      });

      if (existente) {
        console.log(
          `El usuario @${usuario.nickName} ya existe. Se conserva.`
        );
        continue;
      }

      const contraseñaHash = await bcrypt.hash(
        usuario.contraseña,
        10
      );

      await User.create({
        nickName: usuario.nickName,
        nombre: usuario.nombre,
        email: usuario.email,
        contraseña: contraseñaHash,
      });

      console.log(`Usuario @${usuario.nickName} creado.`);
    }

    console.log("Usuarios de ejemplo preparados correctamente.");
  } catch (error) {
    console.error("Error al crear usuarios de ejemplo:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

crearUsuariosDemo();