/**
 * Hume AI Service
 * Analyzes emotion from text transcripts using the Expression Measurement Batch API.
 * Since we can't stream raw phone audio directly to Hume in real-time easily,
 * we analyze the text of each utterance to infer emotional state via the LLM.
 * This is a lightweight, reliable approach that works within free-tier limits.
 */
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Analyze emotion from a text transcript using Groq LLM.
 * Returns one of: happy, confident, hesitant, frustrated, neutral
 * and an intensity score from 0-100.
 */
const analyzeEmotion = async (text) => {
  try {
    if (!text || text.trim().length < 3) {
      return { emotion: 'neutral', intensity: 10 };
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an emotion analyzer. Given a customer's spoken text, detect their emotion.
Return ONLY a JSON object with exactly this format:
{"emotion": "happy|confident|hesitant|frustrated|neutral", "intensity": 0-100}
Examples:
"Yes yes please confirm my order" -> {"emotion": "happy", "intensity": 75}
"What? I don't understand what you're saying" -> {"emotion": "frustrated", "intensity": 60}
"Hmm I'm not sure about this" -> {"emotion": "hesitant", "intensity": 50}
"Yes that's correct" -> {"emotion": "confident", "intensity": 70}
Only return valid JSON, nothing else.`
        },
        { role: 'user', content: text }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 50,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return {
      emotion: result.emotion || 'neutral',
      intensity: Math.min(100, Math.max(0, result.intensity || 10)),
    };
  } catch (error) {
    console.error('❌ Emotion analysis error:', error.message);
    return { emotion: 'neutral', intensity: 10 };
  }
};

module.exports = {
  analyzeEmotion,
};
