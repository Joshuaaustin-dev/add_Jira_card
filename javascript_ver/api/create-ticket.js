export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { itemName, buildNumber, serialNumber } = req.body;

    const JIRA_DOMAIN    = process.env.JIRA_DOMAIN;
    const EMAIL          = process.env.JIRA_EMAIL;
    const API_TOKEN      = process.env.JIRA_API_TOKEN;
    const PROJECT_KEY    = process.env.JIRA_PROJECT_KEY;

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
            return res.status(200).json({ success: true, key: data.key });
        } else {
            return res.status(response.status).json({ success: false, error: data });
        }
    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
