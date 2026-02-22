/**
 * Vercel serverless function — Join request notification
 *
 * Called when someone submits a "Request Access" form.
 * Sends you an email via Resend (free tier: 3,000 emails/month).
 *
 * Required Vercel env vars (no VITE_ prefix — server only):
 *   RESEND_API_KEY   — from resend.com (free account)
 *   NOTIFY_EMAIL     — your email address to receive notifications
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, uid, message } = req.body || {}

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' })
  }

  const resendKey  = process.env.RESEND_API_KEY
  const notifyEmail = process.env.NOTIFY_EMAIL

  if (!resendKey || !notifyEmail) {
    // Email sending not configured — request was still saved to Firestore
    // by the client, so just return success silently.
    console.warn('Email env vars not set — skipping notification email')
    return res.status(200).json({ ok: true })
  }

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'FitForge <onboarding@resend.dev>',
        to: notifyEmail,
        subject: `FitForge: New access request from ${name || email}`,
        html: `
          <h2>New FitForge Access Request</h2>
          <p><strong>Name:</strong> ${name || '(not provided)'}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Firebase UID:</strong> <code style="background:#f0f0f0;padding:2px 6px;border-radius:4px">${uid || '(not available)'}</code></p>
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
          <hr />
          <h3>To approve this person:</h3>
          <ol>
            <li>Go to <strong>Firebase Console → Firestore → config → allowedUsers</strong></li>
            <li>Add the UID above to the <code>uids</code> array</li>
            <li>They can now sign in immediately — no further action needed</li>
          </ol>
          <p style="color:#888">To deny, simply do nothing — their request will remain pending.</p>
        `,
      }),
    })

    if (!emailRes.ok) {
      const errData = await emailRes.json().catch(() => ({}))
      console.error('Resend error:', errData)
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Notification email error:', err)
    // Don't fail the request just because email failed
    return res.status(200).json({ ok: true })
  }
}
