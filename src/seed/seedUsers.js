
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
  orihime: {
    origen: path.join(
      carpetaUploads,
      "OrihimeInoue.jpg"
    ),
    url: "/uploads/OrihimeInoue.jpg",
  },
};

const usuariosDemo = [
  {
    nickName: "ichigo",
    nombre: "Ichigo Kurosaki",
    email: "ichigo@gmail.com",
    contraseña: "rukiaBleach11",
    fotoPerfil: imagenesLocales.ichigo.url,
  },
  {
    nickName: "rukiaa",
    nombre: "Rukia",
    email: "rukia@gmail.com",
    contraseña: "ichigoBleach12",
    fotoPerfil: imagenesLocales.rukia.url,
  },
  {
    nickName: "orihime",
    nombre: "Orihime Inoue",
    email: "OrihimeIno@gmail.com",
    contraseña: "orihimeBleach21",
    fotoPerfil: imagenesLocales.orihime.url,
  },
];

const copiarImagenes = () => {
  fs.mkdirSync(carpetaUploads, { recursive: true });

  [imagenesLocales.rukia, imagenesLocales.ichigo].forEach(
    (imagen) => {
      if (!fs.existsSync(imagen.origen)) {
        throw new Error(
          `No se encontró la imagen: ${imagen.origen}`
        );
      }

      fs.copyFileSync(
        imagen.origen,
        path.join(carpetaUploads, imagen.destino)
      );
    }
  );

  if (!fs.existsSync(imagenesLocales.orihime.origen)) {
    throw new Error(
      "No se encontró OrihimeInoue.jpg dentro de src/public/uploads."
    );
  }

  console.log("Imágenes de ejemplo verificadas.");
};

const obtenerUsuario = async (datos) => {
  let usuario = await User.findOne({
    nickName: datos.nickName,
  });

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

  return Post.create({
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
  return Comment.create({
    contenido,
    userId: usuario._id,
    postId: publicacion._id,
    comentadoEn: new Date(),
  });
};

const crearSeed = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI_DEV ||
      process.env.MONGO_URI ||
      process.env.MONGO_URI_PROD;

    if (!mongoURI) {
      throw new Error(
        "No se encontró una variable de conexión a MongoDB."
      );
    }

    await mongoose.connect(mongoURI);
    console.log("Conectado a MongoDB.");

    copiarImagenes();

    const ichigo = await obtenerUsuario(usuariosDemo[0]);
    const rukia = await obtenerUsuario(usuariosDemo[1]);
    const orihime = await obtenerUsuario(usuariosDemo[2]);

    const usuariosIds = [
      ichigo._id,
      rukia._id,
      orihime._id,
    ];

    const publicacionesAnteriores = await Post.find({
      userId: { $in: usuariosIds },
    }).select("_id");

    const publicacionesIds = publicacionesAnteriores.map(
      (post) => post._id
    );
    await Comment.deleteMany({
      postId: { $in: publicacionesIds },
    });

    await Post.deleteMany({
      userId: { $in: usuariosIds },
    });

    await Follower.deleteMany({
      $or: [
        { followerId: { $in: usuariosIds } },
        { followedId: { $in: usuariosIds } },
      ],
    });

    const rukiaPost1 = await crearPublicacion(
      rukia,
      "Primer posteo de Rukia de River"
    );

    await crearPublicacion(
      rukia,
      "hola !!!",
      ["rukia", "bleach"]
    );

    await crearPublicacion(
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

    const orihimePost1 = await crearPublicacion(
      orihime,
      "hace frío",
      ["bleach", "orihime"],
      [
        "https://i.pinimg.com/1200x/33/19/45/33194598b4f4c963107d32a17388d9b5.jpg",
      ]
    );

    const orihimePost2 = await crearPublicacion(
      orihime,
      "zzzzzz",
      ["bleach", "orihime"],
      [
        "https://i.pinimg.com/736x/2d/46/d5/2d46d5b3db6a00e61500a2da7fb75ff1.jpg",
      ]
    );

    const orihimePost3 = await crearPublicacion(
      orihime,
      "photoshoot !!! :)",
      ["bleach", "rukia", "ichigo", "orihime"],
      [
        "https://i.pinimg.com/736x/09/52/98/0952986ce3df5e7603ee999c63057803.jpg",
        "https://i.pinimg.com/736x/61/b8/24/61b824cf5825fae965354c68513c03cf.jpg",
        "https://i.pinimg.com/736x/08/20/07/082007c5b61197507c57064e6203fffc.jpg",
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

    await crearComentario(
      ichigo,
      orihimePost1,
      "🥶❄️"
    );

    await crearComentario(
      rukia,
      orihimePost1,
      "aguante el invierno"
    );

    await crearComentario(
      ichigo,
      orihimePost2,
      "anda a dormir"
    );

    await crearComentario(
      ichigo,
      orihimePost3,
      "🧡🧡🧡🧡"
    );

    await crearComentario(
      rukia,
      orihimePost3,
      "૮ ˶ᵔ ᵕ ᵔ˶ ა"
    );


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

    await Follower.create([
      {
        followerId: ichigo._id,
        followedId: orihime._id,
      },
      {
        followerId: orihime._id,
        followedId: ichigo._id,
      },
    ]);

    await Follower.create([
      {
        followerId: orihime._id,
        followedId: rukia._id,
      },
      {
        followerId: rukia._id,
        followedId: orihime._id,
      },
    ]);

    console.log("--------------------------------");
    console.log("Seed completado correctamente.");
    console.log("Usuarios: 3");
    console.log("Publicaciones: 8");
    console.log("Comentarios: 9");
    console.log("Etiquetas: creadas o reutilizadas");
    console.log("Seguimiento mutuo: Ichigo y Rukia");
    console.log("--------------------------------");
  } catch (error) {
    console.error("Error al ejecutar el seed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

crearSeed();