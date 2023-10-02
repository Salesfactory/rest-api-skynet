const emailTemplate = ({ user, campaigns, baseUrl }) => {
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
                th, td {
                    padding: 10px;
                    text-align: left;
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
        <p>Hello ${user},</p>
        <p>Your campaign groups have triggered at least one critical alarm. To see the details, please log in to the app.</p>
    `;

    campaigns.map(campaign => {
        const { id, name, client, offpace, unlinked } = campaign;

        html += `<div class="campaign"><h2><a href='${baseUrl}/clients/${client.id}/campaignGroups/${id}'>${name}</a></h2>`;

        if (offpace.length > 0) {
            html += `<h3>Pacing Alerts:</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Campaign Group</th>
                            <th>Channel</th>
                            <th>Pace</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            offpace.forEach(item => {
                html += `
                    <tr>
                        <td>${client.name}</td>
                        <td>${item.name}</td>
                        <td>${item.channel}</td>
                        <td>${item.pace}</td>
                    </tr>
                `;
            });
            html += `</tbody></table>`;
        }

        if (unlinked.length > 0) {
            html += `
                <h3>Link Alerts:</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Campaign Group</th>
                            <th>Channel</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            unlinked.forEach(item => {
                html += `
                    <tr>
                        <td>${client.name}</td>
                        <td>${item.name}</td>
                        <td>${item.channel}</td>
                        <td>${item.status}</td>
                    </tr>
                `;
            });
            html += `
                </tbody>
            </table>
        `;
        }

        html += `</div>`;
    });

    html += `
        </body>
        </html>
    `;

    return html;
};

module.exports = {
    emailTemplate,
};
