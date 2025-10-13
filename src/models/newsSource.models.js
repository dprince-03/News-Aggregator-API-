const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const NewsSource = sequelize.define(
    'NewsSource',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: {
                msg: 'News source name must be unique!',
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
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        website_url: {
            type: DataTypes.STRING(512),
            allowNull: true,
            validate: {
                isUrl: {
                    msg: 'Invalid website URL format',
                },
            },
        },
        api_source: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: 'news_sources',
        timestamps: false,
        underscored: true,
    },
);

// Get all active news sources
NewsSource.getActiveSources = async function () {
    return await NewsSource.findAll({
        where: { is_active: true },
        order: [['display_name', 'ASC']],
    });
};

// Get sources by API provider
NewsSource.getByApiSource = async function (apiSource) {
    return await NewsSource.findAll({
        where: { 
            api_source: apiSource,
            is_active: true 
        },
    });
};

// Find source by name
NewsSource.findByName = async function (name) {
    return await NewsSource.findOne({
        where: { name },
    });
};

// Bulk create sources (for initialization)
NewsSource.initializeSources = async function (sources) {
    return await NewsSource.bulkCreate(sources, {
        ignoreDuplicates: true,
    });
};

module.exports = NewsSource;