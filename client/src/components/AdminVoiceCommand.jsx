import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { sendVoiceCommand } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminVoiceCommand({ onCommandExecuted }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processVoiceCommand(audioBlob);
        // Clean up tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscriptText('');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone for voice commands.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processVoiceCommand = async (audioBlob) => {
    try {
      const data = await sendVoiceCommand(audioBlob);
      if (data.transcript) {
        setTranscriptText(`"${data.transcript}"`);
      }
      
      const { intent } = data;
      
      if (intent.action === 'unknown' || intent.action === 'none') {
        toast.error('Could not understand command.', { icon: '🤷‍♂️' });
      } else {
        toast.success(`Action: ${intent.action.replace('_', ' ')}`, { icon: '🤖' });
        if (onCommandExecuted) {
          onCommandExecuted(intent);
        }
      }
    } catch (error) {
      toast.error('Voice command processing failed.');
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setTranscriptText('');
      }, 3000);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
      {/* Transcript Bubble */}
      {(transcriptText || isProcessing) && (
        <div className="mb-4 mr-2 max-w-xs bg-slate-800 text-slate-200 text-sm py-2 px-4 rounded-2xl rounded-br-sm shadow-xl border border-slate-700 animate-in slide-in-from-bottom-2 fade-in duration-300">
          {isProcessing && !transcriptText ? (
            <div className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-brand-400" />
              <span>Analyzing command...</span>
            </div>
          ) : (
            <p className="italic">{transcriptText}</p>
          )}
        </div>
      )}

      {/* Floating Button */}
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        className={`relative flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-300 ${
          isRecording 
            ? 'bg-rose-500 scale-110 shadow-rose-500/50' 
            : isProcessing 
              ? 'bg-slate-700 cursor-wait' 
              : 'bg-gradient-to-r from-brand-500 to-accent-500 hover:scale-105 shadow-brand-500/30'
        }`}
      >
        {isRecording && (
          <span className="absolute inset-0 rounded-full animate-ping bg-rose-400 opacity-40"></span>
        )}
        
        {isProcessing ? (
          <Loader2 size={24} className="text-white animate-spin" />
        ) : isRecording ? (
          <Square size={24} className="text-white fill-current" />
        ) : (
          <Mic size={28} className="text-white" />
        )}
      </button>
      
      {!isRecording && !isProcessing && !transcriptText && (
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-2 bg-slate-900/80 px-2 py-1 rounded-full backdrop-blur-sm">
          Hold to Speak
        </span>
      )}
    </div>
  );
}
