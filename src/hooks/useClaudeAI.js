import { useState } from 'react'
import { DEFAULT_PROFILE_FALLBACKS } from '../store/useProfileStore'

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

      // Merge user profile with fallbacks so the AI always gets valid values
      const p = { ...DEFAULT_PROFILE_FALLBACKS, ...userProfile }

      const userMessage = `Create a ${p.daysPerWeek || 4}-day workout plan for a ${p.fitnessLevel} with goal: ${p.goal}. Equipment: ${Array.isArray(p.equipment) && p.equipment.length ? p.equipment.join(', ') : 'Barbell, Dumbbells'}. Split: ${p.splitPreference}. Session length: ${p.sessionLength || '60'} minutes. ${supersetsLine}

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

      // Call our Vercel serverless proxy — keeps the API key off the browser
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
