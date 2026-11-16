const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Tag = require('../models/Tag');
const fs = require('fs');
const path = require('path');
const { redisClient } = require('../config/redis');
const { getCommentVisibilityLimit } = require('../utils/commentVisibility');

// listar todos los posts aca con populate para user y tags
 const getPosts = async (req, res) => {
  try {
    const cacheKey = 'posts:all';

    // Buscar si los posts ya están guardados en Redis
    const cachedPosts = await redisClient.get(cacheKey);
    if (cachedPosts) {
      console.log('Sirviendo desde la caché de Redis');
      return res.status(200).json(JSON.parse(cachedPosts));
    }

    // Si no están en Redis, consultar a MongoDB
    const posts = await Post.find()
      .populate('userId', 'nickName nombre')
      .populate('tagIds', 'nombre')
      .sort({ publicadoEn: -1 });

    // Guardar en Redis por 60 segundos (EX: 60)
    await redisClient.set(cacheKey, JSON.stringify(posts), { EX: 60 });
    console.log('Sirviendo desde MongoDB y guardando en Redis');
    
    return res.status(200).json(posts);
  } catch (error) {
    console.error("=== ERROR EN GET POSTS ===", error);
    return res.status(500).json({ 
      error: 'Error al recuperar publicaciones', 
      detalle: error.message 
    });
  }
};

// buscar un post individual por su id y agregarle los comentarios visibles
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id)
      .populate('userId', 'nickName nombre')
      .populate('tagIds', 'nombre');

    if (!post) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }

    // calculamos la fecha limite igual que en comentarios para traer solo los visibles
    const limite =  getCommentVisibilityLimit();

    // buscamos los comentarios que cumplan con la vigencia para este post
    const comentariosVisibles = await Comment.find({ 
      postId: id, 
      comentadoEn: { $gte: limite } 
    })
      .select("_id contenido userId postId comentadoEn")
      .populate("userId", "nickName nombre -_id")
      .sort({ comentadoEn: -1 }); // ordenamos del mas reciente al mas antiguo

    // pasamos el documento a objeto para meterle el array de comentarios
    const postConComentarios = post.toObject();
    postConComentarios.comentarios = comentariosVisibles;

    return res.status(200).json(postConComentarios);
  } catch (error) {
    return res.status(500).json({ error: 'Error al recuperar la publicación', detalle: error.message });
  }
};

// crear un nuevo post juntando urls y archivos de multer
const createPost = async (req, res) => {
  try {
    const { descripcion, userId, tagIds, imagenes, imagenesUrls } = req.body;

    // 1. TAREA 3: Validar que el usuario exista en la BDD antes de crear el post
    const usuarioExiste = await User.findById(userId);
    if (!usuarioExiste) {
      return res.status(400).json({ error: 'El usuario especificado (userId) no existe' });
    }

    // Armar el array de tagids por si viene uno solo o varios
    let tagsArray = [];
    if (tagIds) {
      tagsArray = Array.isArray(tagIds) ? tagIds : [tagIds];
    }

    // 2. TAREA 3: Validar que todas las etiquetas enviadas existan en la BDD
    if (tagsArray.length > 0) {
      const tagsEncontrados = await Tag.find({ _id: { $in: tagsArray } });
      if (tagsEncontrados.length !== tagsArray.length) {
        return res.status(400).json({ error: 'Una o más etiquetas especificadas (tagIds) no existen' });
      }
    }

    let imagenesArray = [];

    // Si mandaron URLs en texto plano las agregamos
    if (imagenes) {
      const urls = Array.isArray(imagenes) ? imagenes : [imagenes];
      imagenesArray.push(...urls.map(url => ({ url })));
    }

    // Si mandaron URLs en imagenesUrls las agregamos también
    if (imagenesUrls) {
      const urlsUrls = Array.isArray(imagenesUrls) ? imagenesUrls : [imagenesUrls];
      imagenesArray.push(...urlsUrls.map(url => ({ url })));
    }

    // Si multer agarró archivos físicos los sumamos
    if (req.files && req.files.length > 0) {
      const archivosLocales = req.files.map(file => ({ url: `/uploads/${file.filename}` }));
      imagenesArray.push(...archivosLocales);
    }

    // Guardar el post nuevo en MongoDB
    const nuevoPost = await Post.create({
      descripcion,
      userId,
      publicadoEn: new Date(),
      imagenes: imagenesArray,
      tagIds: tagsArray,
    });

    const postCompleto = await Post.findById(nuevoPost._id)
      .populate('userId', 'nickName nombre')
      .populate('tagIds', 'nombre');

    // INVALIDACIÓN DE REDIS: Borramos la clave 'posts:all' para renovar la caché
    await redisClient.del('posts:all');

    return res.status(201).json({
      mensaje: 'Publicación creada exitosamente',
      post: postCompleto,
    });
  } catch (error) {
    console.error("=== ERROR AL CREAR POST ===", error);
    return res.status(500).json({
      error: 'Error al crear la publicación',
      detalle: error.message,
    });
  }
};

// patch para actualizar desc, agregar o quitar imagenes y tags
const patchPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, nuevaImagenUrl, eliminarImagenId, agregarTagId, quitarTagId } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }

    if (descripcion) {
      post.descripcion = descripcion;
    }

    // sumar imagen nueva por url
    if (nuevaImagenUrl) {
      post.imagenes.push({ url: nuevaImagenUrl });
    }

    // sumar imagenes fisicas nuevas de multer
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        post.imagenes.push({ url: `/uploads/${file.filename}` });
      });
    }

    // borrar imagen incrustada por id y limpiar disco si era local
    if (eliminarImagenId) {
      const imagenAEliminar = post.imagenes.id(eliminarImagenId);
      if (imagenAEliminar) {
        if (imagenAEliminar.url.startsWith('/uploads/')) {
          const rutaArchivo = path.join(__dirname, '../public', imagenAEliminar.url);
          if (fs.existsSync(rutaArchivo)) {
            fs.unlinkSync(rutaArchivo);
          }
        }
        imagenAEliminar.deleteOne();
      }
    }

    // validar que la etiqueta a agregar exista en la BDD antes de sumarla
    if (agregarTagId) {
      const tagExiste = await Tag.findById(agregarTagId);
      if (!tagExiste) {
        return res.status(400).json({ error: 'La etiqueta (agregarTagId) especificada no existe' });
      }

      // Evitar duplicados en el array comparando strings (.toString())
      const yaExiste = post.tagIds.some(tagId => tagId.toString() === agregarTagId.toString());
      if (!yaExiste) {
        post.tagIds.push(agregarTagId);
      }
    }

    // quitar tag comparando strings
    if (quitarTagId) {
      post.tagIds = post.tagIds.filter(tagId => tagId.toString() !== quitarTagId.toString());
    }

    await post.save();

    const postActualizado = await Post.findById(id)
      .populate('userId', 'nickName nombre')
      .populate('tagIds', 'nombre');

    // INVALIDACIÓN DE REDIS: Borrar la copia desactualizada en memoria RAM
    await redisClient.del('posts:all');

    return res.status(200).json({
      mensaje: 'Publicación modificada exitosamente',
      post: postActualizado,
    });
  } catch (error) {
    console.error("=== ERROR AL MODIFICAR POST ===", error);
    return res.status(500).json({
      error: 'Error al modificar la publicación',
      detalle: error.message,
    });
  }
};

// eliminar post, limpiar sus fotos de la carpeta uploads y borrar comentarios asociados
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }

    if (post.imagenes && post.imagenes.length > 0) {
      for (const img of post.imagenes) {
        if (img.url && img.url.startsWith('/uploads/')) {
          const rutaArchivo = path.join(__dirname, '../public', img.url);
          if (fs.existsSync(rutaArchivo)) {
            fs.unlinkSync(rutaArchivo);
          }
        }
      }
    }

    await Comment.deleteMany({ postId: id });

    await Post.deleteOne({ _id: id });

    await redisClient.del('posts:all');

    return res.status(200).json({ mensaje: `Publicación con ID ${id} eliminada exitosamente` });
  } catch (error) {
    console.error("=== ERROR AL ELIMINAR POST ===", error);
    return res.status(500).json({
      error: 'Error al eliminar la publicación',
      detalle: error.message
    });
  }
};

module.exports = {
  getPosts,
  getPostById,
  createPost,
  patchPost,
  deletePost
};