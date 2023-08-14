'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'agencies',
            [
                {
                    name: 'Stack Adapt',
                    aliases: '["StackAdapt", "Stack Adapt"]',
                    table_name: 'stackadapt_ads_buyer_account',
                    advertiser_id_field: 'sub_advertiser_id',
                    advertiser_name_field: 'sub_advertiser',
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('agencies', null, {});
    },
};
