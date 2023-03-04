import fetch from 'node-fetch'

export default async function handler(request, response) {
    const webhooks = Object.values(request.query)
    if (!webhooks || webhooks.length < 1) {
        return response.status(404).json({
            message: 'Nenhum webhook especificado.'
        })
    }

    const body = request.body

    const ref = body.ref.replace(/^refs\/(heads|tags)\//, '')
    const refType = body.ref.match(/^refs\/heads\//) ? 'branch' : (body.ref.match(/^refs\/tags\//) ? 'tag' : null)

    if (!refType) {
        return response.status(404).json({
            message: 'Tipo de referência não encontrada.'
        })
    }

    if (body.created || body.deleted) {
        const webhookRes = await fetch(webhooks[0], {
            method: 'POST',
            body: JSON.stringify({
                embeds: [
                    {
                        title: `[${body.repository.name}] ${body.created ? 'Created' : 'Removed'} ${refType} ${ref}`,
                        url: body.compare ?? body.repository.url,
                        color: 0x2b2d31,
                        author: {
                            name: body.sender.login,
                            icon_url: body.sender.avatar_url
                        }
                    }
                ]
            }),
            headers: { 'Content-Type': 'application/json' },
        })
    
        const data = webhookRes.status !== 204 ? await webhookRes.json() : {}
    
        return response.status(webhookRes.status).json(data)
    }

    if (!body.commits || body.commits.length <= 0) {
        return response.status(404).json({
            message: 'Nenhum commit encontrado.'
        })
    }

    const commitCount = body.commits.length

    const webhookRes = await fetch(webhooks[0], {
        method: 'POST',
        body: JSON.stringify({
            embeds: [
                {
                    title: `[${body.repository.name}#${ref}] ${commitCount} ${commitCount > 1 ? 'Atualizações' : 'Atualização' }`,
                    url: commitCount > 1 ? body.compare : body.commits[0].url,
                    description: body.commits.map(commit => `**${commit.message}**\n[\`\`${commit.id.slice(0, 7)}\`\`](${commit.url}) - ${commit.author.username}\n`).join('\n'),
                    color: 0x2b2d31,
                    author: {
                        name: body.sender.login,
                        icon_url: body.sender.avatar_url
                    }
                }
            ]
        }),
        headers: { 'Content-Type': 'application/json' },
    })

    const data = webhookRes.status !== 204 ? await webhookRes.json() : {}

    return response.status(webhookRes.status).json(data)
}
