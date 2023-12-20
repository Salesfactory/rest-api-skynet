const emailCampaignFail = ({ user, campaigns }) => {
    let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                tr {
                    background-color: #EAEAEA;
                }
                th, td {
                    padding: 10px;
                    text-align: center;
                    border-bottom: 1px solid #e8e4e4;
                }
                th {
                    background-color: #a0c41c;
                    color: #fff;
                }
                tr:nth-child(even) {
                    background-color: #e8e4e4;
                }
            </style>
        </head>
        <body>
        <p>Hi ${user?.name ?? 'Test'}, </p>
        <p>Something has happened during campaign creation. Please refer below for the status of each creation attempt:</p>
    `;

    // Iterate over each campaign
    campaigns.forEach(campaign => {
        if (campaign.type === 'Campaign') {
            html += `
                <div>
                    <table>
                    <thead>
                        <tr>
                            <th>Campaign Name</th>
                            <th>Status</th>
                            <th>Channel</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${campaign.name}</td>
                            <td>${campaign.reason}</td>
                            <td>${campaign.channel}</td>
                        </tr>
                    </tbody>
                    </table>
                    <table>
                        <thead>
                            <tr>
                                <th>Adset Name</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            campaign?.adsets?.forEach(adset => {
                html += `
                            <tr>
                                <td>${adset.name}</td>
                                <td>${adset.reason}</td>
                            </tr>
            `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
        `;
        } else {
            html += `
                <div>
                    <span>Adset Name: ${campaign.name}</span>
                    <span>Status: ${campaign.reason}</span>
                    <span>Channel: ${campaign.channel}</span>
                </div>
        `;
        }
    });

    html += `
        </body>
        </html>
    `;

    return html;
};
module.exports = { emailCampaignFail };
