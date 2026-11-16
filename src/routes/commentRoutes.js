const { Router } = require("express");
const router = Router();
const {
    getComments,
    getCommentById,
    createComment,
    updateCommentContent,
    deleteComment
} = require('../controllers/commentControllers');
const { validateCommentUserAndPostReferencesExist } = require('../middlewares/validateCommentUserAndPostReferencesExist');
const { validateCreateComment } = require('../middlewares/validateCreateComment');
const { validateCommentId } = require('../middlewares/validateCommentId');
const { validateUpdateComment } = require('../middlewares/validateUpdateComment');
const { validateCommentExistence } = require('../middlewares/validateCommentExistence');

// comentarios
router.get("/", getComments); // obtener todos los comentarios
router.get("/:id", validateCommentId, getCommentById); // obtener un comentario por su ID
router.post("/", validateCreateComment, validateCommentUserAndPostReferencesExist, createComment);// crear un comentario
router.patch('/:id', validateCommentId, validateCommentExistence, validateUpdateComment, updateCommentContent); // actualizar un comentario
router.delete("/:id", validateCommentId, validateCommentExistence, deleteComment); // borrar un comentario

module.exports = router;