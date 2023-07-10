'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'clients',
            [
                { name: 'SFW Global Facebook Account' },
                { name: 'Primo Water' },
                { name: 'Channellock' },
                { name: 'Channellock (US)' },
                { name: 'SFW Agency' },
                { name: 'Sabor - Raydal Hospitality' },
                { name: 'GEsealants' },
                {
                    name: 'NA//US//A//Sealants//Empowerment//GE Sealants Base Media',
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('clients', null, {});
    },
};
