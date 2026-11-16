const express = require('express');
const router = express.Router();
const postController = require('../controllers/postControllers');
const commentController = require('../controllers/commentControllers');
const { handleUpload } = require('../middlewares/multer'); // multer para las fotos fisicas
const { validateCreatePost } = require('../middlewares/validateCreatePost');
const { validateIdPostParam } = require('../middlewares/validateIdPostParam');
const { validatePatchPost } = require('../middlewares/validatePatchPost');
const { validatePostExistence } = require('../middlewares/validatePostExistence');


router.get('/', postController.getPosts); // obtener todos los posts

router.get('/:id', validateIdPostParam, validatePostExistence, postController.getPostById); // obtener un post por id validando parametro y existencia

router.get('/:postId/comments', validateIdPostParam, validatePostExistence, commentController.getCommentsByPostId); // obtener comentarios visibles de una publicación

router.post('/', handleUpload, validateCreatePost, postController.createPost); // crear un post recibiendo hasta 5 archivos en el campo 'imagenes' (soporte híbrido (JSON y Multipart/form-data))

router.patch('/:id', validateIdPostParam, validatePostExistence, handleUpload, validatePatchPost, postController.patchPost); // actualizar un post validando parametro, existencia, multer (soporte híbrido (JSON y Multipart/form-data)) y campos del patch

router.delete('/:id', validateIdPostParam, validatePostExistence, postController.deletePost); // eliminar un post validando parametro y existencia para limpiar disco

module.exports = router;