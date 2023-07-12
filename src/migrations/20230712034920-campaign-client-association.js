'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addConstraint('campaigns', {
            fields: ['client_id'],
            type: 'foreign key',
            name: 'campaigns_client_id_fkey',
            references: {
                table: 'clients',
                field: 'id',
            },
            onDelete: 'cascade',
            onUpdate: 'cascade',
        });
    },

    async down(queryInterface, Sequelize) {
        queryInterface.removeConstraint(
            'campaigns',
            'campaigns_client_id_fkey'
        );
    },
};
