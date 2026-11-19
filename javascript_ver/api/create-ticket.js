const MAX_ITEMS = 5;
const MAX_ITEM_NAME_LENGTH = 255;

function isHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function linkParagraph(label, url) {
    const content = [{ type: 'text', text: `${label}: ` }];
    if (url) {
        content.push({
            type: 'text',
            text: 'Open sheet',
            marks: [{ type: 'link', attrs: { href: url } }]
        });
    } else {
        content.push({ type: 'text', text: 'Not provided' });
    }
    return { type: 'paragraph', content };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const requestedTitle = req.body?.title;
    if (requestedTitle !== undefined && typeof requestedTitle !== 'string') {
        return res.status(400).json({ success: false, message: 'Card title must be text.' });
    }

    const items = req.body?.items;
    if (!Array.isArray(items) || items.length < 1 || items.length > MAX_ITEMS) {
        return res.status(400).json({ success: false, message: `Provide between 1 and ${MAX_ITEMS} items.` });
    }

    const normalizedItems = [];
    for (const item of items) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            return res.status(400).json({ success: false, message: 'Each item must include an item name.' });
        }

        const name = typeof item.name === 'string' ? item.name.trim() : '';
        if ((item.buildSheet !== undefined && typeof item.buildSheet !== 'string')
            || (item.serialSheet !== undefined && typeof item.serialSheet !== 'string')) {
            return res.status(400).json({ success: false, message: 'Sheet links must be text URLs.' });
        }

        const buildSheet = (item.buildSheet || '').trim();
        const serialSheet = (item.serialSheet || '').trim();

        if (!name || name.length > MAX_ITEM_NAME_LENGTH) {
            return res.status(400).json({
                success: false,
                message: `Each item must have a name of 1-${MAX_ITEM_NAME_LENGTH} characters.`
            });
        }
        if ((buildSheet && !isHttpUrl(buildSheet)) || (serialSheet && !isHttpUrl(serialSheet))) {
            return res.status(400).json({
                success: false,
                message: 'Sheet links must be valid HTTP or HTTPS URLs.'
            });
        }

        normalizedItems.push({ name, buildSheet, serialSheet });
    }

    const JIRA_DOMAIN    = process.env.JIRA_DOMAIN;
    const EMAIL          = process.env.JIRA_EMAIL;
    const API_TOKEN      = process.env.JIRA_API_TOKEN;
    const PROJECT_KEY    = process.env.JIRA_PROJECT_KEY;

    const authHeader = Buffer.from(`${EMAIL}:${API_TOKEN}`).toString('base64');
    const summary = (requestedTitle || '').trim()
        || normalizedItems.map(item => item.name).join(' + ').slice(0, MAX_ITEM_NAME_LENGTH);
    if (summary.length > MAX_ITEM_NAME_LENGTH) {
        return res.status(400).json({
            success: false,
            message: `Card title must be no more than ${MAX_ITEM_NAME_LENGTH} characters.`
        });
    }

    const jiraPayload = {
        fields: {
            project: { key: PROJECT_KEY },
            issuetype: { name: "Task" },
            summary,
            description: {
                type: "doc",
                version: 1,
                content: normalizedItems.flatMap((item, index) => [
                    {
                        type: 'heading',
                        attrs: { level: 3 },
                        content: [{ type: 'text', text: `${index + 1}. ${item.name}` }]
                    },
                    linkParagraph('Build Sheet', item.buildSheet),
                    linkParagraph('Serial Sheet', item.serialSheet)
                ])
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
            return res.status(200).json({
                success: true,
                key: data.key,
                url: `https://${JIRA_DOMAIN}/browse/${data.key}`
            });
        } else {
            return res.status(response.status).json({ success: false, error: data });
        }
    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
