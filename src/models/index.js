// models/index.js
const { sequelize } = require("../config/database");

// Import all models
const User = require("./user.models");
const Article = require("./article.models");
const Preference = require("./preference.models");
const SavedArticle = require("./savedArticle.models");
const NewsSource = require("./newsSource.models");
const Category = require("./category.models");
const ApiLog = require("./apiLog.models");

// Initialize models
const models = {
  User,
  Article,
  Preference,
  SavedArticle,
  NewsSource,
  Category,
  ApiLog,
};

// Define associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// User - Preference association (One-to-One)
User.hasOne(Preference, {
  foreignKey: 'user_id',
  as: 'preference'
});

Preference.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User - SavedArticle association (One-to-Many)
User.hasMany(SavedArticle, {
  foreignKey: 'user_id',
  as: 'savedArticles'
});

SavedArticle.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Article - SavedArticle association (One-to-Many)
Article.hasMany(SavedArticle, {
  foreignKey: 'article_id',
  as: 'savedByUsers'
});

SavedArticle.belongsTo(Article, {
  foreignKey: 'article_id',
  as: 'article'
});

// Export models and sequelize
module.exports = {
  ...models,
  sequelize,
};