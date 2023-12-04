const emailAmzTemplate = ({ owner, campaigns }) => {
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
        <p>Hi ${owner?.name ?? 'Test'}, </p>
        <p>Rede has finished creating the Amazon campaigns and adsets in your [Campaign Group Name] group. Please see below for the status of each creation attempt:</p>
    `;

    campaigns.forEach(campaign => {
        html += `
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>Element</th>
                            <th>Status</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><b>${campaign.campaignName}</b></td>
                            <td>${campaign.status}</td>
                            <td>${campaign.description}</td>
                        </tr>
        `;

        campaign.adsets.forEach(adset => {
            html += `
                        <tr>
                            <td>${adset.adsetName}</td>
                            <td>${adset.status}</td>
                            <td>${adset.description}</td>
                        </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    });

    html += `
        <p>This covers the entire [Campaign Group Name] group you submitted to the automated creation queue on [Date Submitted].</p>
        <p>Thanks,</p>
        </body>
        </html>
    `;

    return html;
};

module.exports = {
    emailAmzTemplate,
};
