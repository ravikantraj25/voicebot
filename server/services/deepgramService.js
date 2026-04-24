/**
 * Deepgram Service
 * Uses raw WebSocket connection to Deepgram's streaming API (bypassing the broken SDK v5 live streaming).
 * Uses REST API for pre-recorded audio transcription (Admin Voice Commands).
 */
const WebSocket = require('ws');

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

/**
 * Transcribe a pre-recorded audio buffer to text (for Admin Voice Commands).
 * Uses the Deepgram REST API directly.
 */
const transcribeAudio = async (audioBuffer) => {
  try {
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=en&smart_format=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm',
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      throw new Error(`Deepgram API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    return transcript.trim();
  } catch (error) {
    console.error('❌ Deepgram STT Error:', error);
    throw error;
  }
};

/**
 * Create a live streaming transcription connection using a raw WebSocket.
 * This is more reliable than the SDK v5 connect() which has issues.
 * 
 * Returns a Promise that resolves once the WebSocket is open and ready.
 * The resolved object has:
 *   - sendAudio(buffer): Send raw mulaw audio bytes
 *   - close(): Close the connection
 */
const createLiveTranscriptionStream = (onTranscript, onError) => {
  return new Promise((resolve, reject) => {
    const url = 'wss://api.deepgram.com/v1/listen?' + new URLSearchParams({
      model: 'nova-2',
      encoding: 'mulaw',
      sample_rate: '8000',
      channels: '1',
      interim_results: 'true',
      utterance_end_ms: '1500',
      endpointing: '500',
      smart_format: 'true',
    }).toString();

    const ws = new WebSocket(url, {
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
      },
    });

    ws.on('open', () => {
      console.log('🎤 Deepgram live stream opened (raw WebSocket)');
      
      // Return the connection interface
      resolve({
        sendAudio: (buffer) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(buffer);
          }
        },
        close: () => {
          if (ws.readyState === WebSocket.OPEN) {
            // Send close message to Deepgram
            ws.send(JSON.stringify({ type: 'CloseStream' }));
            ws.close();
          }
        },
      });
    });

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        
        if (data.type === 'Results') {
          const transcript = data.channel?.alternatives?.[0]?.transcript || '';
          if (transcript.trim().length > 0) {
            onTranscript({
              text: transcript.trim(),
              isFinal: data.is_final,
            });
          }
        } else if (data.type === 'UtteranceEnd') {
          onTranscript({ text: '', isFinal: true, utteranceEnd: true });
        }
      } catch (e) {
        // ignore non-JSON messages
      }
    });

    ws.on('error', (err) => {
      console.error('❌ Deepgram WebSocket error:', err.message);
      if (onError) onError(err);
      reject(err);
    });

    ws.on('close', () => {
      console.log('🎤 Deepgram live stream closed');
    });

    // Timeout if connection doesn't open in 10 seconds
    setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        reject(new Error('Deepgram WebSocket connection timeout'));
        ws.close();
      }
    }, 10000);
  });
};

module.exports = {
  transcribeAudio,
  createLiveTranscriptionStream,
};
