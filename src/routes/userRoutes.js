const { Router } = require("express");
const userControllers = require("../controllers/userControllers");
const validateUser = require('../middlewares/validateUser');
const validateUserExistence = require('../middlewares/validateUserExistence');
const validateUserUpdate = require('../middlewares/validateUserUpdate');
const validateFollowUsers = require('../middlewares/validateFollowUsers');
const validateNotSelfFollow = require('../middlewares/validateNotSelfFollow');
const handleProfilePhotoUpload = require('../middlewares/handleProfilePhotoUpload');
const setProfilePhotoPath = require('../middlewares/setProfilePhotoPath');

const router = Router();

// iniciar sesión
router.post("/login", userControllers.loginUser);

// usuarios
router.get("/", userControllers.getUsers); // obtener todos los usuarios
router.get("/:nickName", validateUserExistence, userControllers.getUser); // obtener un usuario por su nickName
router.post("/", validateUser, userControllers.createUser); // crear un usuario
router.patch("/:nickName", validateUserExistence, handleProfilePhotoUpload, setProfilePhotoPath, validateUserUpdate, userControllers.updateUser); // actualizar un usuario
router.delete("/:nickName", validateUserExistence, userControllers.deleteUser); // borrar un usuario

// followers :p
router.get("/:nickName/followers", validateUserExistence, userControllers.getFollowers); // obtener todos los seguidores de un usuario
router.get("/:nickName/following", validateUserExistence, userControllers.getFollowing); // obtener todos los seguidos de un usuario
router.post("/:nickName/following/:followedNickName", validateFollowUsers, validateNotSelfFollow, userControllers.followUser); // un usuario sigue a otro
router.delete("/:nickName/following/:followedNickName", validateFollowUsers, validateNotSelfFollow, userControllers.unFollowUser); // un usuario deja de seguir a otro

module.exports = router;