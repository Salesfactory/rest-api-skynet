module.exports = (sequelize, DataTypes) => {
    const Job = sequelize.define(
        'Job',
        {
            data: {
                type: DataTypes.JSONB,
                allowNull: false,
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'pending', // pending, processing, completed
            },
            processedAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'Job',
            tableName: 'Jobs',
        }
    );

    return Job;
};
