/**
 * Vercel serverless function — Claude API proxy
 *
 * Keeps CLAUDE_API_KEY server-side so it is never exposed in the browser bundle.
 * Set CLAUDE_API_KEY (no VITE_ prefix) in Vercel → Settings → Environment Variables.
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) {
    console.error('CLAUDE_API_KEY environment variable is not set')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    })

    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (err) {
    console.error('Claude proxy error:', err)
    return res.status(500).json({ error: 'Failed to reach Claude API' })
  }
}
