const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const Preference = sequelize.define(
    'Preference',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: {
                args: true,
                name: 'user_id',
                msg: 'User already has preference set!',
            },
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        preferred_sources: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
            get() {
                const rawValue = this.getDataValue('prefered_sources');
                return rawValue ? JSON.parse(rawValue) : [];
            },
            validate: {
                isValidArray(value) {
                    if (value && !Array.isArray(value)) {
                        throw new Error("Preferred categories must be an array");
                    }
                },
            },
        },
        preferred_categories: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
            get() {
                const rawValue = this.getDataValue('preferred_categories');
                return rawValue ? JSON.parse(rawValue) : [];
            },
            validate: {
                isValidArray(value) {
                    if (value && !Array.isArray(value)) {
                        throw new Error("Preferred categories must be an array");
                    }
                },
            },
        },
        preferred_authors: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
            get() {
                const rawValue = this.getDataValue('preferred_authors');
                return rawValue ? JSON.parse(rawValue) : [];
            },
            validate: {
                isValidArray(value) {
                    if (value && !Array.isArray(value)) {
                        throw new Error("Preferred authors must be an array");
                    }
                },
            },
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
        tableName: 'user_preferences',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['user_id'],
            }
        ],
    },
);

// create preference for a user 
Preference.getOrCreateForUser = async (userId) => {
    const [preference, created] = await Preference.findOrCreate({
        where: { user_id: userId },
        defaults: {
            user_id: userId,
            preferred_sources: [],
            preferred_categories: [],
            preferred_authors: [],
        },
    });
    return { preference, created };
};

// update preference for a user
Preference.updateForUser = async (userId, updates) => {
    const preference = await Preference.findOne({
        where: {
            user_id: userId, 
        },
    });
    
    if (!preference) {
        return await Preference.create({
            user_id: userId,
            ...updates,
        });
    }

    return await preference.update(updates);
};

module.exports = Preference;