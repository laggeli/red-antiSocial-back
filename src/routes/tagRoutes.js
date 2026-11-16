const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagControllers');
const { validateTagId } = require('../middlewares/validateTagId');
const { validateCreateTag } = require('../middlewares/validateCreateTag');
const { validateTagExistence } = require('../middlewares/validateTagExistence');

router.get('/', tagController.getTags); // obtener todos los tags

router.get('/:id', validateTagId, validateTagExistence, tagController.getTagById); // buscar un tag por id validando primero el parametro

router.post('/', validateCreateTag, tagController.createTag);// crear un nuevo tag validando el body

router.delete('/:id', validateTagId, validateTagExistence, tagController.deleteTag);// borrar un tag

module.exports = router;