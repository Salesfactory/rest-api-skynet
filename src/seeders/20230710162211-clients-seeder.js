'use strict';

/** @type {import("sequelize-cli").Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            'clients',
            [
                {
                    name: 'SFW Global Facebook Account',
                    aliases: '["SFW Global Facebook Account"]',
                    advertiser_ids: '["act_199559347138974"]',
                    sub_advertiser_ids: null,
                    agency_id: null,
                },
                {
                    name: 'Primo Water',
                    aliases: '["Primo Water"]',
                    sub_advertiser_aliases: '["Primo Water"]',
                    advertiser_ids: '["3968764239"]',
                    sub_advertiser_ids: '["42190"]',
                    agency_id: 1,
                },
                {
                    name: 'Channellock',
                    aliases: '["Channellock", "Channellock (US)"]',
                    sub_advertiser_aliases: '["CHANNELLOCK"]',
                    advertiser_ids:
                        '["2432101105871223","5456360509","act_569377181360420","509457721","7084338459929739265"]',
                    sub_advertiser_ids: '["19579"]',
                    agency_id: 1,
                },
                {
                    name: 'SFW Agency',
                    aliases: '["SFW Agency"]',
                    advertiser_ids: '["73cdd8630efc"]',
                    sub_advertiser_ids: null,
                    agency_id: null,
                },
                {
                    name: 'Sabor - Raydal Hospitality',
                    aliases: '["Sabor - Raydal Hospitality"]',
                    advertiser_ids: '["9999900888", "act_1681322855550427"]',
                    sub_advertiser_ids: null,
                    agency_id: null,
                },
                {
                    name: 'GE Sealants & Adhesives',
                    aliases:
                        '["GEsealants","NA//US//A//Sealants//Empowerment//GE Sealants Base Media"]',
                    sub_advertiser_aliases: '["GE Sealants & Adhesives"]',
                    advertiser_ids:
                        '["8704020890","act_477900034045799","t2_p42v94gg"]',
                    sub_advertiser_ids: '["19782"]',
                    agency_id: 1,
                },
                {
                    name: 'Sales Factory USA',
                    aliases: '["Sales Factory USA"]',
                    advertiser_ids: '["856623833598777f2f275b0a"]',
                    sub_advertiser_ids: null,
                    agency_id: null,
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('clients', null, {});
    },
};
