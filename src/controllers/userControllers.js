const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Follower = require('../models/Follower');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { redisClient } = require('../config/redis');

const datosPublicosUsuario = '_id nickName nombre email fotoPerfil';

const eliminarFotoLocal = async (url) => {
  if (!url || !url.startsWith('/uploads/')) return;

  const ruta = path.join(__dirname, '../public', url);

  try {
    await fs.promises.unlink(ruta);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select(datosPublicosUsuario);

    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener los usuarios',
      error: error.message,
    });
  }
};

const getUser = async (req, res) => {
  try {
    return res.status(200).json(req.user);
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener el usuario',
      error: error.message,
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { nickName, nombre, email, contraseña } = req.body;

    const contraseñaHash = await bcrypt.hash(contraseña, 10);

    const user = await User.create({
      nickName,
      nombre,
      email,
      contraseña: contraseñaHash,
    });

    return res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        _id: user._id,
        nickName: user.nickName,
        nombre: user.nombre,
        email: user.email,
        fotoPerfil: user.fotoPerfil || '',
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'El nickName o Email ya está en uso',
      });
    }

    return res.status(500).json({
      message: 'Error al crear el usuario',
      error: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const usuarioAnterior = req.user;
    const datosActualizados = { ...req.body };

    if (datosActualizados.contraseña) {
      datosActualizados.contraseña = await bcrypt.hash(
        datosActualizados.contraseña,
        10
      );
    }

    const user = await User.findByIdAndUpdate(
      usuarioAnterior._id,
      { $set: datosActualizados },
      { new: true, runValidators: true }
    ).select(datosPublicosUsuario);

    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
      });
    }

    // Si se subió una foto nueva, eliminamos la anterior.
    if (req.file && usuarioAnterior.fotoPerfil !== user.fotoPerfil) {
      await eliminarFotoLocal(usuarioAnterior.fotoPerfil);
    }

    await redisClient.del('posts:all');

    return res.status(200).json({
      message: 'Usuario actualizado con éxito',
      user,
    });
  } catch (error) {
    // Si hubo un error, eliminamos la foto que se acababa de subir.
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (_) {}
    }

    if (error.code === 11000) {
      return res.status(409).json({
        error: 'El nickName o email ya está en uso',
      });
    }

    return res.status(400).json({
      message: 'Error al actualizar usuario',
      error: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = req.user;
    const userId = user._id;

    const postsDelUsuario = await Post.find({ userId }).select('_id imagenes');
    const postIds = postsDelUsuario.map((post) => post._id);

    // Eliminamos las imágenes de las publicaciones.
    for (const post of postsDelUsuario) {
      for (const img of post.imagenes) {
        await eliminarFotoLocal(img.url);
      }
    }

    // Eliminamos la foto de perfil.
    await eliminarFotoLocal(user.fotoPerfil);

    // Eliminamos comentarios propios y comentarios de sus publicaciones.
    await Comment.deleteMany({
      $or: [
        { userId },
        { postId: { $in: postIds } },
      ],
    });

    // Eliminamos sus relaciones de seguidores.
    await Follower.deleteMany({
      $or: [
        { followerId: userId },
        { followedId: userId },
      ],
    });

    await Post.deleteMany({ userId });

    await User.deleteOne({ _id: userId });

    await redisClient.del('posts:all');

    return res.status(200).json({
      message: `Usuario @${user.nickName} y su información asociada fueron eliminados exitosamente`,
    });
  } catch (error) {
    console.error('=== ERROR AL ELIMINAR USUARIO ===', error);

    return res.status(500).json({
      error: 'Error al eliminar el usuario',
      detalle: error.message,
    });
  }
};

const getFollowers = async (req, res) => {
  try {
    const followers = await Follower.find({
      followedId: req.user._id,
    }).populate('followerId', datosPublicosUsuario);

    return res.status(200).json(
      followers.map((relacion) => relacion.followerId)
    );
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener los seguidores',
      error: error.message,
    });
  }
};

const getFollowing = async (req, res) => {
  try {
    const following = await Follower.find({
      followerId: req.user._id,
    }).populate('followedId', datosPublicosUsuario);

    return res.status(200).json(
      following.map((relacion) => relacion.followedId)
    );
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener los usuarios seguidos',
      error: error.message,
    });
  }
};

const followUser = async (req, res) => {
  try {
    const { follower, followed } = req;

    await Follower.create({
      followerId: follower._id,
      followedId: followed._id,
    });

    return res.status(201).json({
      message: `El usuario ${follower.nickName} ahora sigue a ${followed.nickName}`,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Ya sigue a este usuario',
      });
    }

    return res.status(500).json({
      message: 'Error al seguir al usuario',
      error: error.message,
    });
  }
};

const unFollowUser = async (req, res) => {
  try {
    const { follower, followed } = req;

    const relation = await Follower.findOneAndDelete({
      followerId: follower._id,
      followedId: followed._id,
    });

    if (!relation) {
      return res.status(404).json({
        message: 'No sigue a este usuario',
      });
    }

    return res.status(200).json({
      message: `El usuario ${follower.nickName} dejó de seguir a ${followed.nickName}`,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error al dejar de seguir al usuario',
      error: error.message,
    });
  }
};


const loginUser = async (req, res) => {
  try {
    const { nickName, contraseña } = req.body;

    if (!nickName || !contraseña) {
      return res.status(400).json({
        message: "El nickname y la contraseña son obligatorios",
      });
    }

    const user = await User.findOne({ nickName }).select("+contraseña");

    if (!user) {
      return res.status(401).json({ message: "El usuario o la contraseña son incorrectos", });
    }

    const contraseñaCorrecta = await bcrypt.compare(
      contraseña,
      user.contraseña
    );

    if (!contraseñaCorrecta) {
      return res.status(401).json({ message: "El usuario o la contraseña son incorrectos", });
    }

    return res.status(200).json({
      message: "Inicio de sesión exitoso",
      user: {
        _id: user._id,
        nickName: user.nickName,
        nombre: user.nombre,
        email: user.email,
        fotoPerfil: user.fotoPerfil || "",
      },
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);

    return res.status(500).json({
      message: "Error al iniciar sesión",
    });
  }
};

module.exports = {
  getUsers, getUser, createUser, updateUser, deleteUser,
  getFollowers, getFollowing, followUser, unFollowUser, loginUser
};