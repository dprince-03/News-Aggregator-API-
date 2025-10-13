const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/db.config');

const Article = sequelize.define(
	"Article",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		title: {
			tyoe: DataTypes.TEXT,
			allowNull: false,
			validate: {
				notNull: {
					args: true,
					msg: "Title is required",
				},
				notEmpty: {
					args: true,
					msg: "Title cannot be empty",
				},
			},
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		author: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		source_name: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		category: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		published_at: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		url: {
			type: DataTypes.STRING(2048),
			allowNull: true,
			unique: {
				args: true,
				name: "url",
				msg: "Article with this URL already exists!",
			},
			validate: {
				isUrl: {
					args: true,
					msg: "Invalid URL format",
				},
			},
		},
		url_to_image: {
			type: DataTypes.STRING(2048),
			allowNull: true,
			validate: {
				isUrl: {
					args: true,
					msg: "Invalid URL format",
				},
			},
		},
		source_id: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		updated_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		tableName: "articles",
		timestamps: true,
		underscored: true,
		indexes: [
			{
				name: "idx_source",
				fields: ["source_name"],
			},
			{
				name: "idx_category",
				fields: ["category"],
			},
			{
				name: "idx_published",
				fields: ["published_at"],
			},
			{
				name: "idx_url",
				unique: true,
				fields: ["url"],
			},
		],
	},
);

// filter articles
Article.filterArticles = async function (filters = {}, options = {}) {
	const { limit = 20, offset = 0 } = options;
	const whereClause = {};

	if (filters.source) {
		whereClause.source_name = filters.source;
	}

	if (filters.category) {
		whereClause.category = filters.category;
	}

	if (filters.author) {
		whereClause.author = { [Op.like]: `%${filters.author}%` };
	}

	if (filters.startDate && filters.endDate) {
		whereClause.published_at = {
			[Op.between]: [filters.startDate, filters.endDate],
		};
	} else if (filters.startDate) {
		whereClause.published_at = {
			[Op.gte]: filters.startDate,
		};
	} else if (filters.endDate) {
		whereClause.published_at = {
			[Op.lte]: filters.endDate,
		};
	}

	return await Article.findAndCountAll({
		where: whereClause,
		order: [["published_at", "DESC"]],
		limit,
		offset,
	});
};

// get personalized articles based on preferences
Article.getPersonalizedArticles = async function (preferences, options = {}) {
	const { limit = 20, offset = 0 } = options;
	const whereClause = {
		[Op.or]: [],
	};

	if (preferences.preferred_sources && preferences.preferred_sources.length > 0) {
		whereClause[Op.or].push({
			source_name: { [Op.in]: preferences.preferred_sources },
		});
	}

	if (preferences.preferred_categories && preferences.preferred_categories.length > 0) {
		whereClause[Op.or].push({
			category: { [Op.in]: preferences.preferred_categories },
		});
	}

	if (preferences.preferred_authors && preferences.preferred_authors.length > 0) {
		preferences.preferred_authors.forEach((author) => {
			whereClause[Op.or].push({
				author: { [Op.like]: `%${author}%` },
			});
		});
	}

	// If no preferences set, return all articles
	if (whereClause[Op.or].length === 0) {
		delete whereClause[Op.or];
	}

	return await Article.findAndCountAll({
		where: whereClause,
		order: [["published_at", "DESC"]],
		limit,
		offset,
	});
};

// create articles (for aggregation)
Article.bulkCreateArticles = async function (articles) {
	return await Article.bulkCreate(articles, {
		ignoreDuplicates: true, // Skip duplicates based on unique constraints
		validate: true,
	});
};

module.exports = Article;