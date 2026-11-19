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
    destino: "seed-orihime.jpg",
    url: "/uploads/OrihimeInoue.jpg",
  },
  aizen: {
    origen: path.join(
      carpetaUploads,
      "AizenIcon.jpg"
    ),
    destino: "seed-aizen.jpg",
    url: "/uploads/AizenIcon.jpg",
  },
  sasuke: {
    origen: path.join(
      carpetaUploads,
      "SasukeUchiha.jpg"
    ),
    destino: "seed-sasuke.jpg",
    url: "/uploads/SasukeUchiha.jpg",
  },
  naruto: {
    origen: path.join(
      carpetaUploads,
      "NarutoUzumaki.jpg"
    ),
    destino: "seed-naruto.jpg",
    url: "/uploads/NarutoUzumaki.jpg",
  },
  hinata: {
    origen: path.join(
      carpetaUploads,
      "HinataHyuga.jpg"
    ),
    destino: "seed-hinata.jpg",
    url: "/uploads/HinataHyuga.jpg",
  },
  sakura: {
    origen: path.join(
      carpetaUploads,
      "SakuraHaruno.jpg"
    ),
    destino: "seed-sakura.jpg",
    url: "/uploads/SakuraHaruno.jpg",
  },
  kakashi: {
    origen: path.join(
      carpetaUploads,
      "KakashiHatake.jpg"
    ),
    destino: "seed-kakashi.jpg",
    url: "/uploads/KakashiHatake.jpg",
  }
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
  {
    nickName: "aizen",
    nombre: "Sōsuke Aizen",
    email: "aizenSosuke@gmail.com",
    contraseña: "aizenBleach33",
    fotoPerfil: imagenesLocales.aizen.url,
  },
  {
    nickName: "sasuke",
    nombre: "Sasuke Uchiha",
    email: "sasukeUchiha@gmail.com",
    contraseña: "sasukeShippuden",
    fotoPerfil: imagenesLocales.sasuke.url,
  },
  {
    nickName: "naruto",
    nombre: "Naruto Uzumaki",
    email: "narutouzumaki@gmail.com",
    contraseña: "narutoShippuden",
    fotoPerfil: imagenesLocales.naruto.url,
  },
  {
    nickName: "hinata",
    nombre: "Hinata Hyūga",
    email: "hinataaa@gmail.com",
    contraseña: "hinataShippuden",
    fotoPerfil: imagenesLocales.hinata.url,
  },
  {
    nickName: "sakura",
    nombre: "Sakura Haruno",
    email: "sakuraharu@gmail.com",
    contraseña: "sakuraShippuden",
    fotoPerfil: imagenesLocales.sakura.url,
  },
  {
    nickName: "kakashi",
    nombre: "Kakashi Hatake",
    email: "kakashi117@gmail.com",
    contraseña: "kakashiHatake",
    fotoPerfil: imagenesLocales.kakashi.url,
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

  if (!fs.existsSync(imagenesLocales.orihime.origen)) { throw new Error("No se encontró OrihimeInoue.jpg dentro de src/public/uploads."); }

  console.log("Imágenes de ejemplo verificadas.");
};

const obtenerUsuario = async (datos) => {
  let usuario = await User.findOne({ nickName: datos.nickName, });

  if (!usuario) {
    const contraseñaHash = await bcrypt.hash(datos.contraseña, 10);

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

  if (!tag) {tag = await Tag.create({ nombre });}
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
    const aizen = await obtenerUsuario(usuariosDemo[3]);
    const sasuke = await obtenerUsuario(usuariosDemo[4]);
    const naruto = await obtenerUsuario(usuariosDemo[5]);
    const hinata = await obtenerUsuario(usuariosDemo[6]);
    const sakura = await obtenerUsuario(usuariosDemo[7]);
    const kakashi = await obtenerUsuario(usuariosDemo[8]);

    const usuariosIds = [
      ichigo._id,
      rukia._id,
      orihime._id,
      aizen._id,
      sasuke._id,
      naruto._id,
      hinata._id,
      sakura._id,
      kakashi._id,
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

    const rukiaPost1 = await crearPublicacion(rukia,
      "primer posteo de Rukia"
    );

    await crearPublicacion(rukia, "hola !!!", ["rukia", "bleach"]);

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

    const aizenPost1 = await crearPublicacion(
      aizen,
      "turquía",
      ["turco", "turkey", "aizen", "bleach"],
      [
        "https://i.pinimg.com/736x/c5/df/78/c5df78124ac2e14cd8257eb7135bceff.jpg",
        "https://i.pinimg.com/736x/eb/9e/c4/eb9ec40aa6f8bacbdcc41504f82748f5.jpg",
        "https://i.pinimg.com/736x/c7/be/5a/c7be5a7d8357bc6ecf70d7fc467b4fc0.jpg",
      ]
    );

    await crearPublicacion(
      aizen,
      "tirando rostro",
      ["aizen", "bleach"],
      [
        "https://i.pinimg.com/736x/e7/95/55/e79555e7945fa2e14bd00eaa9a61fe57.jpg",
        "https://i.pinimg.com/736x/38/8c/f9/388cf91d9a5e13825c4b3114761688ba.jpg"
      ]
    );

    const aizenPost3 = await crearPublicacion(
      aizen,
      "me caso ",
      ["love", "aizen", "bleach"],
      [
        "https://i.pinimg.com/736x/87/0e/26/870e267e7dd24f421f23f60481294dcf.jpg"
      ]
    );

    const sasukePost1 = await crearPublicacion(
      sasuke,
      "cansado",
      ["sasuke", "uchiha"],
      [
        "https://i.pinimg.com/736x/0c/2c/df/0c2cdf25077bdf2fbec4ba4e6c29653f.jpg",
        "https://i.pinimg.com/736x/60/0d/88/600d88d6b4292bf61d583340d8a29cdb.jpg",
        "https://i.pinimg.com/736x/5e/fe/97/5efe975eb4aa8bc7348a438604768335.jpg"
      ]
    );

    const sasukePost2 = await crearPublicacion(
      sasuke,
      "...",
      ["sasuke", "uchiha"],
      [
        "https://i.pinimg.com/736x/73/ed/09/73ed09551d18d7a580f07dbbfe614a51.jpg",
        "https://i.pinimg.com/736x/0c/a4/d6/0ca4d6abc38586e0abd1f6d3449f10d2.jpg",
        "https://i.pinimg.com/736x/cc/9e/4c/cc9e4c92efeb871cbc28d7d59488e7ec.jpg"
      ]
    );

    const sasukePost3 = await crearPublicacion(
      sasuke,
      "rinnegan :)",
      ["sasuke", "uchiha"],
      [
        "https://i.pinimg.com/736x/7b/64/c8/7b64c8cb3fdc050e073d4a559b6f4b87.jpg"
      ]
    );

    const narutoPost1 = await crearPublicacion(
      naruto,
      "extrañando a alguien",
      ["naruto", "uzumaki"],
      [
        "https://i.pinimg.com/1200x/a5/9f/9e/a59f9e17a4d2d7f07894b4a2a39fa44d.jpg",
        "https://i.pinimg.com/736x/70/54/72/7054722590bd4d5cd100347a5815f655.jpg",
        "https://i.pinimg.com/736x/4d/c7/31/4dc731ebac02cc83d5356574d1d78512.jpg"
      ]
    );

    const narutoPost2 = await crearPublicacion(
      naruto,
      "renegando",
      ["naruto", "uzumaki"],
      [
        "https://i.pinimg.com/736x/16/fc/a5/16fca59459c6cfb7c27f3012213231d3.jpg",
        "https://i.pinimg.com/1200x/3e/cc/f2/3eccf2c44f4212e9e7e9cad1958f2d92.jpg",
        "https://i.pinimg.com/1200x/e0/24/0e/e0240e5d6516c7fbe7a40d1ac5fa1323.jpg"
      ]
    );

    const hinataPost1 = await crearPublicacion(
      naruto,
      "⋆𐙚₊˚⊹♡",
      ["hinata", "hyuga"],
      [
        "https://i.pinimg.com/736x/f2/15/de/f215de54f3c0b0535e452335a4ee557f.jpg",
        "https://i.pinimg.com/736x/ee/b7/f0/eeb7f057775cde149c683d51725655d1.jpg"
      ]
    );

    const sakuraPost1 = await crearPublicacion(
      sakura,
      "holaaa :3",
      ["sakura", "haruno"],
      [
        "https://i.pinimg.com/736x/0d/5a/d7/0d5ad7a2309d06d40c73937d44ba9314.jpg",
        "https://i.pinimg.com/736x/92/da/1f/92da1fe07e5227bdb53986141322319c.jpg",
        "https://i.pinimg.com/736x/de/5a/39/de5a39222030101a80bdcd1d20e43045.jpg"
      ]
    );

    const sakuraPost2 = await crearPublicacion(
      sakura,
      "de perfil !!",
      ["sakura", "haruno"],
      [
        "https://i.pinimg.com/736x/7f/7a/95/7f7a95be01704dfad9c3bf5b7f0cb6e0.jpg",
        "https://i.pinimg.com/736x/95/55/d7/9555d7578642f12939fbae9ca76ee30e.jpg"
      ]
    );

    const kakashiPost1 = await crearPublicacion(
      kakashi,
      "leyendo un poco",
      ["kakashi", "hatake"],
      [
        "https://i.pinimg.com/1200x/7c/34/c2/7c34c23f682365427b8c2978f72894f2.jpg",
        "https://i.pinimg.com/736x/4d/51/b7/4d51b77e01abf8186f0673b2e652bdcc.jpg",
        "https://i.pinimg.com/1200x/ad/d0/98/add098a113b4b06325472aee2e3abaeb.jpg",
        "https://i.pinimg.com/1200x/85/28/af/8528afb53aedbac31867f519d57e3d79.jpg"
      ]
    );

    await crearComentario(rukia, rukiaPost1, "hola");

    await crearComentario( rukia, ichigoPost1, "hola :p" );

    await crearComentario(ichigo, rukiaPost4, "aguante river" );
    await crearComentario(rukia, rukiaPost4, "obviooo!!!" );

    await crearComentario(ichigo, orihimePost1, "🥶❄️");
    await crearComentario(rukia, orihimePost1, "aguante el invierno");

    await crearComentario(ichigo, orihimePost2, "anda a dormir");

    await crearComentario(ichigo, orihimePost3, "🧡🧡🧡🧡" );
    await crearComentario(rukia, orihimePost3, "૮ ˶ᵔ ᵕ ᵔ˶ ა");

    await crearComentario(ichigo, aizenPost1, "re de la unión soviética" );
    await crearComentario(rukia, aizenPost1, "☭");
    await crearComentario(orihime, aizenPost1, "qué loco");

    await crearComentario(ichigo, aizenPost3, "🥂" );
    await crearComentario(rukia, aizenPost3, "con un hombre o con una mujer?");
    await crearComentario(orihime, aizenPost3, "🤵🏻👰🏻");

    await crearComentario(naruto, sasukePost1, "volvé !!!" );
    await crearComentario(sakura, sasukePost1, "hablemoss");
    await crearComentario(kakashi, sasukePost1, " ᶻ 𝘇 𐰁 ");

    await crearComentario(sakura, sasukePost2, "estás loco");
    await crearComentario(kakashi, sasukePost2, " 😤");

    await crearComentario(naruto, sasukePost3, "✇💜");

    await crearComentario(hinata, narutoPost1, "જ⁀➴ ♡");
    await crearComentario(sakura, narutoPost1, "yo también");
    await crearComentario(kakashi, narutoPost1, "ya somos 3");

    await crearComentario(hinata, narutoPost2, "🥺");

    await crearComentario(naruto, hinataPost1, "🤩");

    await crearComentario(hinata, sakuraPost1, "qué bonita");
    await crearComentario(sasuke, sakuraPost1, "medio rara");

    await crearComentario(naruto, sakuraPost2, "holaaaaa");

    await crearComentario(naruto, kakashiPost1, "cortala con la lectura ya");
    await crearComentario(sakura, kakashiPost1, "vive leyendo :p");

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

    await Follower.create([
      {
        followerId: ichigo._id,
        followedId: aizen._id,
      },
      {
        followerId: aizen._id,
        followedId: ichigo._id,
      },
    ]);

    await Follower.create([
      {
        followerId: aizen._id,
        followedId: rukia._id,
      },
      {
        followerId: rukia._id,
        followedId: aizen._id,
      },
    ]);

    await Follower.create([
      {
        followerId: orihime._id,
        followedId: aizen._id,
      },
      {
        followerId: aizen._id,
        followedId: orihime._id,
      },
    ]);

    await Follower.create([
      {
        followerId: naruto._id,
        followedId: sasuke._id,
      },
      {
        followerId: sasuke._id,
        followedId: naruto._id,
      },
    ]);

    await Follower.create([
      {
        followerId: naruto._id,
        followedId: sakura._id,
      },
      {
        followerId: sakura._id,
        followedId: naruto._id,
      },
    ]);

    await Follower.create([
      {
        followerId: naruto._id,
        followedId: hinata._id,
      },
      {
        followerId: hinata._id,
        followedId: naruto._id,
      },
    ]);

    await Follower.create([
      {
        followerId: naruto._id,
        followedId: kakashi._id,
      },
      {
        followerId: kakashi._id,
        followedId: naruto._id,
      },
    ]);

    await Follower.create([
      {
        followerId: sasuke._id,
        followedId: sakura._id,
      },
      {
        followerId: sakura._id,
        followedId: sasuke._id,
      },
    ]);

    await Follower.create([
      {
        followerId: sasuke._id,
        followedId: hinata._id,
      },
      {
        followerId: hinata._id,
        followedId: sasuke._id,
      },
    ]);

    await Follower.create([
      {
        followerId: sasuke._id,
        followedId: kakashi._id,
      },
      {
        followerId: kakashi._id,
        followedId: sasuke._id,
      },
    ]);

    await Follower.create([
      {
        followerId: sakura._id,
        followedId: hinata._id,
      },
      {
        followerId: hinata._id,
        followedId: sakura._id,
      },
    ]);

    await Follower.create([
      {
        followerId: sakura._id,
        followedId: kakashi._id,
      },
      {
        followerId: kakashi._id,
        followedId: sakura._id,
      },
    ]);

    await Follower.create([
      {
        followerId: hinata._id,
        followedId: kakashi._id,
      },
      {
        followerId: kakashi._id,
        followedId: hinata._id,
      },
    ]);

    console.log("Seed completado correctamente.");
    console.log("Usuarios: 8");
    console.log("Publicaciones: 20");
    console.log("Comentarios: 31");
    console.log("Etiquetas: creadas o reutilizadas");
    console.log("Seguimiento mutuo: Ichigo y todos los demás");
    console.log("Seguimiento mutuo: Orihime y todos los demás");
    console.log("Seguimiento mutuo: Rukia y todos los demás");
    console.log("Seguimiento mutuo: Aizen y todos los demás");
    console.log("Seguimiento mutuo: Naruto y todos los demás");
    console.log("Seguimiento mutuo: Sasuke y todos los demás");
    console.log("Seguimiento mutuo: Sakura y todos los demás");
    console.log("Seguimiento mutuo: Kakashi y todos los demás");
  } catch (error) {
    console.error("Error al ejecutar el seed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

crearSeed();