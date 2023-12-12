const emailAmzTemplate = ({ user, campaignGroupName, campaigns }) => {
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
        <p>Rede has finished creating the Amazon campaigns and adsets in your ${
            campaignGroupName ?? ''
        } group. Please see below for the status of each creation attempt:</p>
    `;

    // Iterate over each campaign
    Object.keys(campaigns).forEach(campaignId => {
        const adsets = campaigns[campaignId];

        html += `
                <div>
                    <span>Campaign Name: ${campaignId}</span>
                    <table>
                        <thead>
                            <tr>
                                <th>Adset Name</th>
                                <th>Status</th>
                                <th>Format</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        // Iterate over adsets of the campaign
        adsets.forEach(adset => {
            html += `
                            <tr>
                                <td>${adset.name}</td>
                                <td>${adset.status}</td>
                                <td>${adset.format ?? 'N/A'}</td>
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
        <p>This covers the entire ${
            campaignGroupName ?? ''
        } group you submitted to the automated creation queue on [Date Submitted].</p>
        <p>Thanks,</p>
        </body>
        </html>
    `;

    return html;
};
module.exports = { emailAmzTemplate };
