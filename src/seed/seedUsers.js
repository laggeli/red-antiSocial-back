require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Tag = require("../models/Tag");
const Follower = require("../models/Follower");

const carpetaAssets = path.join(__dirname, "assets");
const carpetaUploads = path.join(__dirname, "../public/uploads");

const imagenesLocales = {
  rukia: {
    origen: path.join(
      carpetaAssets,
      "1794893999861-Rukia___river_plate_pfp.jpg"
    ),
    destino: "seed-rukia.jpg",
    url: "/uploads/seed-rukia.jpg",
  },
  ichigo: {
    origen: path.join(
      carpetaAssets,
      "1794894094257-a7b27c33f2c870ca6a5888002e6d9520.jpg"
    ),
    destino: "seed-ichigo.jpg",
    url: "/uploads/seed-ichigo.jpg",
  },
};

const usuariosDemo = [
  {
    nickName: "ichigo",
    nombre: "Ichigo Kurosaki",
    email: "ichigo@gmail.com",
    contraseña: "123456",
    fotoPerfil: imagenesLocales.ichigo.url,
  },
  {
    nickName: "rukiaa",
    nombre: "Rukia",
    email: "rukia@gmail.com",
    contraseña: "123456",
    fotoPerfil: imagenesLocales.rukia.url,
  },
];

const copiarImagenes = () => {
  fs.mkdirSync(carpetaUploads, { recursive: true });

  Object.values(imagenesLocales).forEach((imagen) => {
    if (!fs.existsSync(imagen.origen)) {
      throw new Error(
        `No se encontró la imagen: ${imagen.origen}`
      );
    }

    fs.copyFileSync(
      imagen.origen,
      path.join(carpetaUploads, imagen.destino)
    );
  });

  console.log("Imágenes de ejemplo copiadas.");
};

const obtenerUsuario = async (datos) => {
  let usuario = await User.findOne({
    nickName: datos.nickName,
  }).select("+contraseña");

  if (!usuario) {
    const contraseñaHash = await bcrypt.hash(
      datos.contraseña,
      10
    );

    usuario = await User.create({
      ...datos,
      contraseña: contraseñaHash,
    });
  } else {
    usuario.nombre = datos.nombre;
    usuario.email = datos.email;
    usuario.fotoPerfil = datos.fotoPerfil;
    await usuario.save();
  }

  return usuario;
};

const obtenerTag = async (nombre) => {
  let tag = await Tag.findOne({ nombre });

  if (!tag) {
    tag = await Tag.create({ nombre });
  }

  return tag;
};

const crearPublicacion = async (
  usuario,
  descripcion,
  nombresTags = [],
  imagenes = []
) => {
  const tags = await Promise.all(
    nombresTags.map((nombre) => obtenerTag(nombre))
  );

  return await Post.create({
    descripcion,
    userId: usuario._id,
    tagIds: tags.map((tag) => tag._id),
    imagenes: imagenes.map((url) => ({ url })),
    publicadoEn: new Date(),
  });
};

const crearComentario = async (
  usuario,
  publicacion,
  contenido
) => {
  return await Comment.create({
    contenido,
    userId: usuario._id,
    postId: publicacion._id,
    comentadoEn: new Date(),
  });
};

const crearSeed = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI_DEV || process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error("No se encontró la URI de MongoDB.");
    }

    await mongoose.connect(mongoURI);
    console.log("Conectado a MongoDB.");

    copiarImagenes();

    const ichigo = await obtenerUsuario(usuariosDemo[0]);
    const rukia = await obtenerUsuario(usuariosDemo[1]);

    const idsUsuarios = [ichigo._id, rukia._id];

    const publicacionesAnteriores = await Post.find({
      userId: { $in: idsUsuarios },
    }).select("_id");

    const idsPublicaciones = publicacionesAnteriores.map(
      (post) => post._id
    );

    await Comment.deleteMany({
      $or: [
        { userId: { $in: idsUsuarios } },
        { postId: { $in: idsPublicaciones } },
      ],
    });

    await Post.deleteMany({
      userId: { $in: idsUsuarios },
    });

    await Follower.deleteMany({
      $or: [
        { followerId: { $in: idsUsuarios } },
        { followedId: { $in: idsUsuarios } },
      ],
    });

    const rukiaPost1 = await crearPublicacion(
      rukia,
      "Primer posteo de Rukia de River"
    );

    const rukiaPost2 = await crearPublicacion(
      rukia,
      "hola !!!",
      ["rukia", "bleach"]
    );

    const rukiaPost3 = await crearPublicacion(
      rukia,
      ":3",
      ["rukia", "bleach"],
      [
        "https://i.pinimg.com/736x/95/5c/50/955c50b684c1f3e887f5853f3b1c414e.jpg",
      ]
    );

    const rukiaPost4 = await crearPublicacion(
      rukia,
      "river plate :p",
      ["carp", "riverplate", "rukia"],
      [imagenesLocales.rukia.url]
    );

    const ichigoPost1 = await crearPublicacion(
      ichigo,
      "02:42",
      ["bleach", "archive"],
      [
        "https://i.pinimg.com/736x/1c/01/dc/1c01dc14188cfe9377f0394ee74ab3db.jpg",
      ]
    );

    await crearComentario(rukia, rukiaPost1, "hola");

    await crearComentario(
      rukia,
      ichigoPost1,
      "hola :p"
    );

    await crearComentario(
      ichigo,
      rukiaPost4,
      "aguante river"
    );

    await crearComentario(
      rukia,
      rukiaPost4,
      "obviooo!!!"
    );

    // Seguimiento mutuo.
    await Follower.create([
      {
        followerId: ichigo._id,
        followedId: rukia._id,
      },
      {
        followerId: rukia._id,
        followedId: ichigo._id,
      },
    ]);

    console.log("--------------------------------");
    console.log("Seed completado correctamente.");
    console.log("Usuarios: ichigo y rukiaa");
    console.log("Publicaciones: 5");
    console.log("Comentarios: 4");
    console.log("Seguimiento mutuo: creado");
    console.log("--------------------------------");
  } catch (error) {
    console.error("Error al ejecutar el seed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

crearSeed();