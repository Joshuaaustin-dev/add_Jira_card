const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors()); 
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.post('/api/create-ticket', async (req, res) => {
    const { itemName, buildNumber, serialNumber } = req.body;

    //environment variables
    const JIRA_DOMAIN = process.env.JIRA_DOMAIN; 
    const EMAIL = process.env.JIRA_EMAIL;
    const API_TOKEN = process.env.JIRA_API_TOKEN; 
    const PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

    // Encode credentials to Basic Auth
    const authHeader = Buffer.from(`${EMAIL}:${API_TOKEN}`).toString('base64');

    const jiraPayload = {
        fields: {
            project: { key: PROJECT_KEY },
            issuetype: { name: "Task" }, 
            summary: `${itemName}`,
            description: {
                type: "doc",
                version: 1,
                content: [
                {
                    type: "paragraph",
                    content: [
                                {
                                    type: "text",
                                    text: "Build Sheet",
                                    marks: [{ type: "link", attrs: { href: buildNumber } }]
                                }
                            ]
                        },
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: "Serial Sheet",
                                    marks: [{ type: "link", attrs: { href: serialNumber } }]
                                }
                            ]
                        }
                    ]
            }
        }
    };

    try {
        const response = await fetch(`https://${JIRA_DOMAIN}/rest/api/3/issue`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authHeader}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jiraPayload)
        });

        const data = await response.json();

        if (response.ok) {
            res.status(200).json({ success: true, key: data.key });
        } else {
            res.status(response.status).json({ success: false, error: data });
        }
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));