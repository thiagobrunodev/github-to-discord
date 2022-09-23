import fetch from 'node-fetch'

export default async function handler(request, response) {
    const webhooks = Object.values(request.query)
    if (!webhooks || webhooks.length < 1) {
        return response.status(404).json({
            message: 'Nenhum webhook especificado.'
        })
    }

    const push = request.body
    const commitCount = push.commits.length

    const webhookRes = await fetch(webhooks[0], {
        method: 'POST',
        body: JSON.stringify({
            embeds: [
                {
                    title: `[${push.repository.name}] ${commitCount} ${commitCount > 1 ? 'Atualizações' : 'Atualização' }`,
                    url: commitCount > 1 ? push.compare : push.commits[0].url,
                    description: push.commits.map(commit => `**${commit.message}**\n[\`\`${commit.id.slice(0, 7)}\`\`](${commit.url}) - ${commit.author.username}\n`).join('\n'),
                    author: {
                        name: push.sender.login,
                        icon_url: push.sender.avatar_url
                    }
                }
            ]
        }),
        headers: { 'Content-Type': 'application/json' },
    })

    const data = webhookRes.status !== 204 ? await webhookRes.json() : {}

    return response.status(webhookRes.status).json(data)
}
