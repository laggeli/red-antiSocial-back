const User = require('../models/User'); 
const Post = require('../models/Post'); 
const Comment = require('../models/Comment'); 
const Follower = require('../models/Follower');
const fs = require('fs'); 
const path = require('path');
const bcrypt = require('bcryptjs');
const { redisClient } = require('../config/redis');

// controllers de users
const getUsers = async (req, res) => { // obtener todos los usuarios
    try {
        const users = await User.find().select("nickName nombre email");
        res.status(200).json(users);
    } catch (error) { res.status(500).json({ message: "Error al obtener los usuarios", error: error.message }); }
};

const getUser = async (req, res) => { // obtener un usuario por su nickName
    try { res.status(200).json(req.user); } 
    catch (error) { res.status(500).json({ message: "Error al obtener el usuario", error: error.message }); }
}

const createUser = async (req, res) => { // crear un usuario
    try {
        const { nickName, nombre, email, contraseña } = req.body;
        const contraseñaHash = await bcrypt.hash(contraseña, 10);
        const user = await User.create({ nickName, nombre, email, contraseña: contraseñaHash });
        res.status(201).json({ 
            message: "Usuario creado éxitosamente", 
            user: { nickName: user.nickName, email: user.email, nombre: user.nombre } 
        });
    } catch (error) {
        if (error.code === 11000) { return res.status(409).json({ error: "El nickName o Email ya está en uso" }); }
        res.status(500).json({ message: "Error al crear el usuario", error: error.message });
    }
};

const updateUser = async (req, res) => { // actualizar un usuario
    try {
        const { nickName } = req.params;
        const datosActualizados = { ...req.body };
        if (datosActualizados.contraseña) { datosActualizados.contraseña = await bcrypt.hash(datosActualizados.contraseña, 10); }
        const user = await User.findOneAndUpdate( { nickName }, datosActualizados, { new: true, runValidators: true });
        
        await redisClient.del('posts:all');
        res.status(200).json({ message: "Usuario actualizado con éxito", user });
    } catch (error) { res.status(400).json({ message: "Error al actualizar usuario", error: error.message });
  }
};

// eliminar usuario y toda su información vinculada en cascada
const deleteUser = async (req, res) => {
  try {
    const user = req.user;
    const userId = user._id;

    const postsDelUsuario = await Post.find({ userId }).select('_id imagenes');
    const postIds = postsDelUsuario.map(post => post._id);

    for (const post of postsDelUsuario) {
      for (const img of post.imagenes) {
        if (img.url && img.url.startsWith('/uploads/')) {

          const rutaArchivo = path.resolve(__dirname, '../public', `.${img.url}`);

          try { await fs.promises.unlink(rutaArchivo); } 
          catch (error) { if (error.code !== 'ENOENT') { throw error; } }
        }
      }
    }
    await Comment.deleteMany({ // borras comentarios del usuaroi
      $or: [
        { userId: userId },
        { postId: { $in: postIds } }
      ]
    });

    await Follower.deleteMany({ // borras seguidores y seguidos del usuario
      $or: [
        { followerId: userId },
        { followedId: userId }
      ]
    });

    await Post.deleteMany({ userId }); // borras los posteos

    await User.deleteOne({ _id: userId }); // borras el usuario a lo ultimo

    await redisClient.del('posts:all');
    
    return res.status(200).json({
      mensaje: `Usuario @${user.nickName} y toda su información asociada fueron eliminados exitosamente`
    });

  } catch (error) {
    console.error("=== ERROR AL ELIMINAR USUARIO ===", error);
    return res.status(500).json({
      error: 'Error al eliminar el usuario',
      detalle: error.message
    });
  }
};

// controllers de followers
const getFollowers = async (req, res) => { // obtener todos los seguidores de un usuario
    try {
        const followers = await Follower.find({ followedId: req.user._id }).populate("followerId", "nickName nombre email");
        res.status(200).json( followers.map(relacion => relacion.followerId) );
    } catch (error) { res.status(500).json({ message: "Error al obtener los seguidores", error: error.message }); }
}

const getFollowing = async (req, res) => { // obtener todos los seguidos de un usuario
    try {
        const following = await Follower.find({ followerId: req.user._id }).populate("followedId", "nickName nombre email");

        res.status(200).json( following.map(relacion => relacion.followedId) );
    } catch (error) { res.status(500).json({ message: "Error al obtener los usuarios seguidos", error: error.message }); }
}

const followUser = async (req, res) => { // seguir a un usuario
    try {
        const { nickName, followedNickName } = req.params;
        const follower = await User.findOne({ nickName });
        const followed = await User.findOne({ nickName: followedNickName });

        await Follower.create({ followerId: follower._id, followedId: followed._id });
        res.status(201).json({ message: `El usuario ${nickName} ahora sigue a ${followedNickName}` });
    } catch (error) {
        if (error.code === 11000) { return res.status(409).json({ message: "Ya sigue a este usuario" }); }
        res.status(500).json({ message: "Error al seguir al usuario", error: error.message });
    }
}

const unFollowUser = async (req, res) => { // dejar de seguir a un usuario
    try {
        const { nickName, followedNickName } = req.params;
        const follower = await User.findOne({ nickName });
        const followed = await User.findOne({ nickName: followedNickName });
        const relation = await Follower.findOneAndDelete({ followerId: follower._id, followedId: followed._id });

        if (!relation) { return res.status(404).json({ message: "No sigue a este usuario" }); }

        res.status(200).json({ message: `El usuario ${nickName} dejó de seguir a ${followedNickName}` });
    } catch (error) { res.status(500).json({ message: "Error al dejar de seguir al usuario", error: error.message }); }
}

module.exports = { 
    getUsers, getUser, createUser, updateUser, deleteUser,
    getFollowers, getFollowing, followUser, unFollowUser
}