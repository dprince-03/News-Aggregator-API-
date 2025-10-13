const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');
const bcrypt = require('bcrypt');

const User = sequelize.define(
    'User',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: {
                args: true,
                name: 'email',
                msg: 'Email address already in use!',
            },
            validate: {
                isEmail: {
                    args: true,
                    msg: 'Invalid email format',
                },
                notNull: {
                    args: true,
                    msg: 'Email is required',
                },
                notEmpty: {
                    args: true,
                    msg: 'Email cannot be empty',
                },
            },
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notNull: {
                    args: true,
                    msg: 'Password is required',
                },
                notEmpty: {
                    args: true,
                    msg: 'Password cannot be empty',
                },
                len: {
                    args: [8, 255],
                    msg: 'Password must be at least 6 characters long',
                },
            },
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                len: {
                    args: [2, 255],
                    msg: 'Name must be at least 2 characters long',
                },
            },
        },
        create_at: {
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
        tableName: 'users',
        timestamps: true,
        underscored: true,
        hooks: {
            // hash passwords before creating a user
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            // hash passwords before updating a user
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
        },
    },
);

// compare password
User.prototype.comparePassword = async (candidatePassword) => {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error("Password comparison failed");
    }
};

// get user without password
User.prototype.toJSON = () => {
    const values = { ...this.get() };
    delete values.password;
    return values;
};

User.findByEmailWithPassword = async (email) => {
    return await User.findOne({
        where: { email },
        attributes: ['id', 'email', 'password', 'name', 'create_at', 'updated_at'],
    });
};

module.exports = User;
