const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const SavedArticle = sequelize.define(
	"SavedArticle",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: "users",
				key: "id",
			},
			onDelete: "CASCADE",
			onUpdate: "CASCADE",
		},
		article_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: "articles",
				key: "id",
			},
			onDelete: "CASCADE",
			onUpdate: "CASCADE",
		},
		saved_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		tableName: "saved_articles",
		timestamps: false,
		underscored: true,
		indexes: [
			{
				unique: true,
				name: "unique_user_article",
				fields: ["user_id", "article_id"],
			},
			{
				name: "idx_user_id",
				fields: ["user_id"],
			},
			{
				name: "idx_article_id",
				fields: ["article_id"],
			},
		],
	}
);

// save an article for a user
SavedArticle.saveArticleForUser = async function (userId, articleId) {
	const [savedArticle, created] = await SavedArticle.findOrCreate({
		where: {
			user_id: userId,
			article_id: articleId,
		},
		defaults: {
			user_id: userId,
			article_id: articleId,
		},
	});

	return { savedArticle, created };
};

// unsave an article
SavedArticle.unsaveArticleForUser = async function (userId, articleId) {
	return await SavedArticle.destroy({
		where: {
			user_id: userId,
			article_id: articleId,
		},
	});
};

// get all saved articles for a user
SavedArticle.getSavedArticlesForUser = async function (userId, options = {}) {
	const { limit = 20, offset = 0 } = options;

	return await SavedArticle.findAndCountAll({
		where: { user_id: userId },
		order: [["saved_at", "DESC"]],
		limit,
		offset,
	});
};

// Check if article is saved by user
SavedArticle.isArticleSaved = async function (userId, articleId) {
    const saved = await SavedArticle.findOne({
        where: {
            user_id: userId,
            article_id: articleId,
        },
    });
    return !!saved;
};

module.exports = SavedArticle;