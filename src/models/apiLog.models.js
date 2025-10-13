const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const ApiLog = sequelize.define(
    'ApiLog',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        api_source: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'API source is required',
                },
                notEmpty: {
                    msg: 'API source cannot be empty',
                },
            },
        },
        endpoint: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        status_code: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        response_time_ms: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: 'api_logs',
        timestamps: false,
        underscored: true,
        indexes: [
            {
                name: 'idx_api_source',
                fields: ['api_source'],
            },
            {
                name: 'idx_created_at',
                fields: ['created_at'],
            },
        ],
    },
);

// Log API request
ApiLog.logRequest = async function (logData) {
    return await ApiLog.create(logData);
};

// Get logs by date range
ApiLog.getLogsByDateRange = async function (startDate, endDate, source = null) {
    const where = {
        created_at: {
            [sequelize.Sequelize.Op.between]: [startDate, endDate],
        },
    };

    if (source) {
        where.api_source = source;
    }

    return await ApiLog.findAll({
        where,
        order: [['created_at', 'DESC']],
    });
};

// Get API statistics
ApiLog.getApiStats = async function (days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await ApiLog.findAll({
        attributes: [
            'api_source',
            [sequelize.fn('COUNT', sequelize.col('id')), 'request_count'],
            [sequelize.fn('AVG', sequelize.col('response_time_ms')), 'avg_response_time'],
            [sequelize.fn('MAX', sequelize.col('response_time_ms')), 'max_response_time'],
        ],
        where: {
            created_at: {
                [sequelize.Sequelize.Op.gte]: startDate,
            },
        },
        group: ['api_source'],
        raw: true,
    });
};

module.exports = ApiLog;