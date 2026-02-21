import { useState } from 'react'

export function useClaudeAI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function generatePlan(userProfile) {
    setLoading(true)
    setError(null)
    try {
      const systemPrompt = `You are a professional personal trainer. Generate a structured workout plan as valid JSON only. No markdown, no explanation - only the JSON object.`

      const supersetsLine = userProfile.supersets
        ? 'Organise exercises into supersets where appropriate (pair antagonist or complementary movements back-to-back). Label superset pairs in the exercise notes field with "Superset with: <partner exercise name>".'
        : 'Do not use supersets; list exercises as straight sets.'

      const userMessage = `Create a ${userProfile.daysPerWeek || 4}-day workout plan for a ${userProfile.fitnessLevel || 'intermediate'} with goal: ${userProfile.goal || 'muscle_gain'}. Equipment: ${userProfile.equipment?.join(', ') || 'Barbell, Dumbbells'}. Split: ${userProfile.splitPreference || 'push_pull_legs'}. Session length: ${userProfile.sessionLength || '60'} minutes. ${supersetsLine}

Return JSON in this exact format:
{
  "planName": "string",
  "description": "string",
  "days": [
    {
      "dayLabel": "Day 1 - Push",
      "exercises": [
        {
          "name": "Barbell Bench Press",
          "sets": 4,
          "reps": "8-10",
          "rest": "90 sec",
          "notes": "optional coaching note"
        }
      ]
    }
  ]
}`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `API error: ${response.status}`)
      }

      const data = await response.json()
      const jsonText = data.content[0].text.trim()

      // Strip any accidental markdown code fences
      const cleaned = jsonText.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim()
      return JSON.parse(cleaned)
    } catch (err) {
      console.error('Claude API error:', err)
      setError(err.message || 'Failed to generate plan. Check your API key.')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { generatePlan, loading, error }
}
