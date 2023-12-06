'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'deprecated_campaign_types',
            [
                {
                    channel_id: 2,
                    name: 'POST_ENGAGEMENT',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    channel_id: 2,
                    name: 'REACH',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    channel_id: 2,
                    name: 'PAGE_LIKES',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    channel_id: 2,
                    name: 'BRAND_AWARENESS',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    channel_id: 2,
                    name: 'CONVERSIONS',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    channel_id: 2,
                    name: 'LINK_CLICKS',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('deprecated_campaign_types', null, {});
    },
};
