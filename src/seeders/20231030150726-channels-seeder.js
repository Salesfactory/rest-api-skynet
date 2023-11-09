'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'channels',
            [
                {
                    name: 'Google Ads',
                    active: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    name: 'Facebook',
                    active: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    name: 'Amazon Advertising',
                    active: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    name: 'Instagram',
                    active: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    name: 'Twitter',
                    active: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    name: 'Youtube',
                    active: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            {}
        );
        /**
         * Add seed commands here.
         *
         * Example:
         * await queryInterface.bulkInsert('People', [{
         *   name: 'John Doe',
         *   isBetaMember: false
         * }], {});
         */
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('channels', null, {});
        /**
         * Add commands to revert seed here.
         *
         * Example:
         * await queryInterface.bulkDelete('People', null, {});
         */
    },
};
