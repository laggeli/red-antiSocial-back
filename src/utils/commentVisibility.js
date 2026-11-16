// calcula la fecha a partir de la cual los comentarios son visibles
const getCommentVisibilityLimit = () => {
    const mesesConfig = parseInt(process.env.COMMENT_MAX_MONTHS, 10) || 6;

    const limite = new Date();
    limite.setMonth(limite.getMonth() - mesesConfig);

    return limite;
};

module.exports = { getCommentVisibilityLimit };