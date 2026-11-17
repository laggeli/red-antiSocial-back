const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Tag = require('../models/Tag');
const fs = require('fs');
const path = require('path');
const { redisClient } = require('../config/redis');
const { getCommentVisibilityLimit } = require('../utils/commentVisibility');

// Listar todos los posts con populate para usuario y etiquetas.
const getPosts = async (req, res) => {
  try {
    const filtro = req.query.userId
      ? { userId: req.query.userId }
      : {};

    // Solo cacheamos el feed completo.
    // Las consultas filtradas son específicas de cada usuario.
    if (!req.query.userId) {
      const cachedPosts = await redisClient.get('posts:all');

      if (cachedPosts) {
        return res.status(200).json(JSON.parse(cachedPosts));
      }
    }

    const posts = await Post.find(filtro)
      .populate('userId', 'nickName nombre fotoPerfil')
      .populate('tagIds', 'nombre')
      .sort({ publicadoEn: -1 });

    if (!req.query.userId) {
      await redisClient.set(
        'posts:all',
        JSON.stringify(posts),
        { EX: 60 }
      );
    }

    return res.status(200).json(posts);
  } catch (error) {
    console.error('=== ERROR EN GET POSTS ===', error);

    return res.status(500).json({
      error: 'Error al recuperar publicaciones',
      detalle: error.message,
    });
  }
};

// Buscar un post individual por su ID y agregarle los comentarios visibles.
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate('userId', 'nickName nombre fotoPerfil')
      .populate('tagIds', 'nombre');

    if (!post) {
      return res.status(404).json({
        error: 'Publicación no encontrada',
      });
    }

    // Calculamos la fecha límite igual que en comentarios
    // para traer solamente los visibles.
    const limite = getCommentVisibilityLimit();

    const comentariosVisibles = await Comment.find({
      postId: id,
      comentadoEn: { $gte: limite },
    })
      .select('_id contenido userId postId comentadoEn')
      .populate('userId', 'nickName nombre fotoPerfil')
      .sort({ comentadoEn: -1 });

    // Pasamos el documento a objeto para agregarle el array de comentarios.
    const postConComentarios = post.toObject();
    postConComentarios.comentarios = comentariosVisibles;

    return res.status(200).json(postConComentarios);
  } catch (error) {
    return res.status(500).json({
      error: 'Error al recuperar la publicación',
      detalle: error.message,
    });
  }
};

// Crear un nuevo post juntando URLs y archivos de Multer.
const createPost = async (req, res) => {
  try {
    const { descripcion, userId, tagIds, imagenes, imagenesUrls } = req.body;

    // Validar que el usuario exista en la base de datos.
    const usuarioExiste = await User.findById(userId);

    if (!usuarioExiste) {
      return res.status(400).json({
        error: 'El usuario especificado (userId) no existe',
      });
    }

    // Armar el array de tagIds por si viene uno solo o varios.
    let tagsArray = [];

    if (tagIds) {
      tagsArray = Array.isArray(tagIds) ? tagIds : [tagIds];
    }

    // Validar que todas las etiquetas enviadas existan.
    if (tagsArray.length > 0) {
      const tagsEncontrados = await Tag.find({
        _id: { $in: tagsArray },
      });

      if (tagsEncontrados.length !== tagsArray.length) {
        return res.status(400).json({
          error: 'Una o más etiquetas especificadas (tagIds) no existen',
        });
      }
    }

    let imagenesArray = [];

    // Si mandaron URLs en texto plano, las agregamos.
    if (imagenes) {
      const urls = Array.isArray(imagenes) ? imagenes : [imagenes];

      imagenesArray.push(
        ...urls.map((url) => ({ url }))
      );
    }

    // Si mandaron URLs en imagenesUrls, las agregamos también.
    if (imagenesUrls) {
      const urlsUrls = Array.isArray(imagenesUrls)
        ? imagenesUrls
        : [imagenesUrls];

      imagenesArray.push(
        ...urlsUrls.map((url) => ({ url }))
      );
    }

    // Si Multer recibió archivos físicos, los sumamos.
    if (req.files && req.files.length > 0) {
      const archivosLocales = req.files.map((file) => ({
        url: `/uploads/${file.filename}`,
      }));

      imagenesArray.push(...archivosLocales);
    }

    // Guardar el post nuevo en MongoDB.
    const nuevoPost = await Post.create({
      descripcion,
      userId,
      publicadoEn: new Date(),
      imagenes: imagenesArray,
      tagIds: tagsArray,
    });

    const postCompleto = await Post.findById(nuevoPost._id)
      .populate('userId', 'nickName nombre fotoPerfil')
      .populate('tagIds', 'nombre');

    // Invalidar la caché del feed general.
    await redisClient.del('posts:all');

    return res.status(201).json({
      mensaje: 'Publicación creada exitosamente',
      post: postCompleto,
    });
  } catch (error) {
    console.error('=== ERROR AL CREAR POST ===', error);

    return res.status(500).json({
      error: 'Error al crear la publicación',
      detalle: error.message,
    });
  }
};

// Actualizar descripción, agregar o quitar imágenes y etiquetas.
const patchPost = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      descripcion,
      nuevaImagenUrl,
      eliminarImagenId,
      agregarTagId,
      quitarTagId,
    } = req.body;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        error: 'Publicación no encontrada',
      });
    }

    if (descripcion) {
      post.descripcion = descripcion;
    }

    // Sumar imagen nueva por URL.
    if (nuevaImagenUrl) {
      post.imagenes.push({ url: nuevaImagenUrl });
    }

    // Sumar imágenes físicas nuevas de Multer.
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        post.imagenes.push({
          url: `/uploads/${file.filename}`,
        });
      });
    }

    // Borrar imagen incrustada por ID y limpiar disco si era local.
    if (eliminarImagenId) {
      const imagenAEliminar = post.imagenes.id(eliminarImagenId);

      if (imagenAEliminar) {
        if (imagenAEliminar.url.startsWith('/uploads/')) {
          const rutaArchivo = path.join(
            __dirname,
            '../public',
            imagenAEliminar.url
          );

          if (fs.existsSync(rutaArchivo)) {
            fs.unlinkSync(rutaArchivo);
          }
        }

        imagenAEliminar.deleteOne();
      }
    }

    // Validar que la etiqueta a agregar exista.
    if (agregarTagId) {
      const tagExiste = await Tag.findById(agregarTagId);

      if (!tagExiste) {
        return res.status(400).json({
          error: 'La etiqueta (agregarTagId) especificada no existe',
        });
      }

      // Evitar duplicados comparando los IDs como strings.
      const yaExiste = post.tagIds.some(
        (tagId) => tagId.toString() === agregarTagId.toString()
      );

      if (!yaExiste) {
        post.tagIds.push(agregarTagId);
      }
    }

    // Quitar etiqueta comparando los IDs como strings.
    if (quitarTagId) {
      post.tagIds = post.tagIds.filter(
        (tagId) => tagId.toString() !== quitarTagId.toString()
      );
    }

    await post.save();

    const postActualizado = await Post.findById(id)
      .populate('userId', 'nickName nombre fotoPerfil')
      .populate('tagIds', 'nombre');

    // Borrar la copia desactualizada de Redis.
    await redisClient.del('posts:all');

    return res.status(200).json({
      mensaje: 'Publicación modificada exitosamente',
      post: postActualizado,
    });
  } catch (error) {
    console.error('=== ERROR AL MODIFICAR POST ===', error);

    return res.status(500).json({
      error: 'Error al modificar la publicación',
      detalle: error.message,
    });
  }
};

// Eliminar post, limpiar sus fotos de uploads y borrar comentarios asociados.
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        error: 'Publicación no encontrada',
      });
    }

    if (post.imagenes && post.imagenes.length > 0) {
      for (const img of post.imagenes) {
        if (img.url && img.url.startsWith('/uploads/')) {
          const rutaArchivo = path.join(
            __dirname,
            '../public',
            img.url
          );

          if (fs.existsSync(rutaArchivo)) {
            fs.unlinkSync(rutaArchivo);
          }
        }
      }
    }

    await Comment.deleteMany({ postId: id });

    await Post.deleteOne({ _id: id });

    await redisClient.del('posts:all');

    return res.status(200).json({
      mensaje: `Publicación con ID ${id} eliminada exitosamente`,
    });
  } catch (error) {
    console.error('=== ERROR AL ELIMINAR POST ===', error);

    return res.status(500).json({
      error: 'Error al eliminar la publicación',
      detalle: error.message,
    });
  }
};

module.exports = {
  getPosts, getPostById, createPost, patchPost, deletePost,
};