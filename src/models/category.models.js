const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const Category = sequelize.define(
    'Category',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: {
                msg: 'Category name must be unique!',
            },
            validate: {
                notNull: {
                    msg: 'Name is required',
                },
                notEmpty: {
                    msg: 'Name cannot be empty',
                },
            },
        },
        display_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: 'categories',
        timestamps: false,
        underscored: true,
    }
);

// Get all categories
Category.getAll = async function () {
    return await Category.findAll({
        order: [['display_name', 'ASC']],
    });
};

// Find category by name
Category.findByName = async function (name) {
    return await Category.findOne({
        where: { name },
    });
};

// Get categories by names array
Category.getByNames = async function (names) {
    return await Category.findAll({
        where: { name: names },
    });
};

// Bulk create categories (for initialization)
Category.initializeCategories = async function (categories) {
    return await Category.bulkCreate(categories, {
        ignoreDuplicates: true,
    });
};

// Validate categories array
Category.validateCategories = async function (categoryNames) {
    if (!Array.isArray(categoryNames)) return false;
    
    const validCategories = await Category.findAll({
        where: { name: categoryNames },
        attributes: ['name'],
    });
    
    return validCategories.length === categoryNames.length;
};

module.exports = Category;