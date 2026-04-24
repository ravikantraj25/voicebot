/**
 * Sarvam AI Service
 * Handles Speech-to-Text (saarika:v2) and Text-to-Speech (bulbul:v1)
 * Optimized for Indian languages: Hindi, Kannada, Marathi
 */
const fetch = require('node-fetch');
const FormData = require('form-data');

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

// Map our dashboard language codes to Sarvam language codes
const languageMap = {
  hindi: 'hi-IN',
  kannada: 'kn-IN',
  marathi: 'mr-IN',
  english: 'en-IN',
};

/**
 * Text-to-Speech using bulbul:v1
 * Converts text into base64 mulaw audio for Twilio (8000Hz)
 */
const generateSpeech = async (text, language = 'hindi') => {
  if (!SARVAM_API_KEY) throw new Error('SARVAM_API_KEY is missing');

  try {
    const targetLanguageCode = languageMap[language.toLowerCase()] || 'hi-IN';

    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': SARVAM_API_KEY,
      },
      body: JSON.stringify({
        inputs: [text],
        target_language_code: targetLanguageCode,
        speaker: 'meera',
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        speech_sample_rate: 8000,
        enable_preprocessing: true,
        model: 'bulbul:v1',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sarvam TTS Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const rawBase64 = data.audios[0]; // base64 WAV audio from Sarvam
    
    // Convert PCM WAV → mulaw for Twilio
    const wavBuffer = Buffer.from(rawBase64, 'base64');
    
    // Skip WAV header (first 44 bytes) to get raw PCM samples
    const headerSize = 44;
    const pcmData = wavBuffer.length > headerSize ? wavBuffer.slice(headerSize) : wavBuffer;
    
    // Convert 16-bit PCM to 8-bit mulaw
    const mulawBuffer = pcmToMulaw(pcmData);
    return mulawBuffer.toString('base64');
  } catch (error) {
    console.error('Sarvam TTS Exception:', error);
    throw error;
  }
};

/**
 * Convert 16-bit Linear PCM to 8-bit mu-law encoding
 * This is required because Twilio media streams use mulaw audio format
 */
function pcmToMulaw(pcmBuffer) {
  const MULAW_MAX = 0x1FFF;
  const MULAW_BIAS = 33;
  const numSamples = Math.floor(pcmBuffer.length / 2);
  const mulawBuffer = Buffer.alloc(numSamples);

  for (let i = 0; i < numSamples; i++) {
    let sample = pcmBuffer.readInt16LE(i * 2);
    
    // Determine sign
    const sign = (sample < 0) ? 0x80 : 0;
    if (sample < 0) sample = -sample;
    
    // Clip
    if (sample > MULAW_MAX) sample = MULAW_MAX;
    sample += MULAW_BIAS;
    
    // Find the segment (exponent)
    let exponent = 7;
    let mask = 0x4000;
    for (; exponent > 0; exponent--, mask >>= 1) {
      if (sample & mask) break;
    }
    
    // Combine sign, exponent, and mantissa
    const mantissa = (sample >> (exponent + 3)) & 0x0F;
    mulawBuffer[i] = ~(sign | (exponent << 4) | mantissa) & 0xFF;
  }

  return mulawBuffer;
}

/**
 * Speech-to-Text using saarika:v2
 * Transcribes base64 or raw audio buffer back to text
 */
const transcribeSpeech = async (audioBuffer, language = 'hindi') => {
  if (!SARVAM_API_KEY) throw new Error('SARVAM_API_KEY is missing');

  try {
    const targetLanguageCode = languageMap[language.toLowerCase()] || 'hi-IN';
    
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: 'audio.wav',
      contentType: 'audio/wav',
    });
    formData.append('language_code', targetLanguageCode);
    formData.append('model', 'saarika:v2');

    const response = await fetch('https://api.sarvam.ai/speech-to-text/translate', {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sarvam STT Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.transcript;
  } catch (error) {
    console.error('Sarvam STT Exception:', error);
    throw error;
  }
};

module.exports = {
  generateSpeech,
  transcribeSpeech,
  languageMap,
};
