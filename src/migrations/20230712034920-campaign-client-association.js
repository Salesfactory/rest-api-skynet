'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addConstraint('campaign_groups', {
            fields: ['client_id'],
            type: 'foreign key',
            name: 'campaign_group_client_id_fkey',
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
            'campaign_groups',
            'campaign_group_client_id_fkey'
        );
    },
};
