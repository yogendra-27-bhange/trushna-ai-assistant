// src/hooks/useSpeechRecognition.ts
"use client";

import { useState, useCallback, useEffect, useRef } from 'react';

interface SpeechRecognitionOptions {
  onResult?: (transcript: string) => void;
  onWakeWord?: () => void;
  onCommand?: (command: string) => void;
  onError?: (error: string) => void;
  wakeWord?: string;
}

const WAKE_WORD_TIMEOUT = 3000; // Time to listen for wake word before restarting (if continuous)
const COMMAND_TIMEOUT = 5000; // Max time to listen for a command after wake word

export function useSpeechRecognition(options?: SpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const [isAwake, setIsAwake] = useState(false); // True if wake word detected

  const recognitionRef = useRef<any | null>(null);
  const wakeWordTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setSupported(true);
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = true; // Keep listening
      recognitionRef.current.interimResults = true; // Get results as they come
    } else {
      setSupported(false);
    }

    return () => {
      recognitionRef.current?.stop();
      if (wakeWordTimeoutRef.current) clearTimeout(wakeWordTimeoutRef.current);
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    };
  }, []);

  const handleResult = useCallback((event: any) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    
    setTranscript(interimTranscript || finalTranscript); // Show interim results
    const fullTranscript = (finalTranscript || interimTranscript).toLowerCase().trim();

    if (options?.wakeWord && !isAwake) {
      if (fullTranscript.includes(options.wakeWord.toLowerCase())) {
        setIsAwake(true);
        setTranscript(''); // Clear wake word from transcript
        recognitionRef.current?.stop(); // Stop wake word listening
        options.onWakeWord?.();
        // Automatically start listening for command after wake word
        if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
        commandTimeoutRef.current = setTimeout(() => {
            if (isListening) { // If still listening for command and timed out
                recognitionRef.current?.stop();
                setIsListening(false);
                setIsAwake(false); // Reset awake state
                options?.onError?.("Command listening timed out.");
            }
        }, COMMAND_TIMEOUT);
        recognitionRef.current?.start(); // Start listening for command
        setIsListening(true);
        return; // Don't process wake word as a command
      }
    } else if (isAwake && finalTranscript) { // If awake and received a final command
        setIsListening(false);
        setIsAwake(false);
        setTranscript('');
        recognitionRef.current?.stop();
        options?.onCommand?.(finalTranscript.trim());
        if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    } else if (!options?.wakeWord && finalTranscript) { // Direct command without wake word
        setIsListening(false);
        setTranscript('');
        recognitionRef.current?.stop();
        options?.onCommand?.(finalTranscript.trim());
    }

    options?.onResult?.(finalTranscript || interimTranscript);

  }, [options, isAwake, isListening]);

  const handleError = useCallback((event: any) => {
    let errorMessage = event.error;
    if (event.error === 'no-speech') {
      // This can happen frequently with continuous listening, might not be a "hard" error
      // For wake word, we might want to restart listening
      if (options?.wakeWord && !isAwake && recognitionRef.current) {
         // recognitionRef.current.start(); // Potentially restart
         // return; 
      }
      errorMessage = "No speech detected. Please try again.";
    } else if (event.error === 'audio-capture') {
      errorMessage = "Audio capture failed. Check microphone permissions.";
    } else if (event.error === 'not-allowed') {
      errorMessage = "Microphone access denied. Please enable it in your browser settings.";
    }
    setError(errorMessage);
    options?.onError?.(errorMessage);
    setIsListening(false);
    setIsAwake(false);
  }, [options, isAwake]);

  const startListening = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop(); // Stop current listening before starting new
    }
    
    setTranscript('');
    setError(null);
    recognitionRef.current.onresult = handleResult;
    recognitionRef.current.onerror = handleError;
    recognitionRef.current.onend = () => {
        // If it ended while it was supposed to be listening for a wake word, and not due to command processing
        if (options?.wakeWord && !isAwake && isListening) {
            // This means it stopped, maybe due to timeout or silence. Restart for wake word.
            // Be careful with infinite loops if permissions are an issue.
            // recognitionRef.current?.start(); 
        } else if (!isAwake) { // If it wasn't for wake word and wasn't processing command
             setIsListening(false);
        }
    };

    try {
      recognitionRef.current.start();
      setIsListening(true);
      if (options?.wakeWord && !isAwake) {
        // If listening for wake word, set a timeout to "restart" it to keep it active
        // This part is tricky for true continuous wake word in browser.
        // For now, this example relies on manual start primarily for commands.
      }
    } catch (e: any) {
      handleError(e as any);
    }
  }, [supported, handleResult, handleError, isListening, options, isAwake]);

  const stopListening = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
    setIsAwake(false);
    if (wakeWordTimeoutRef.current) clearTimeout(wakeWordTimeoutRef.current);
    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
  }, [supported]);
  
  // For explicit command listening after wake word (or button press)
  const listenForCommand = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    setIsAwake(true); // Assume triggered by wake word or button
    startListening(); // Uses the general startListening logic
  }, [supported, startListening]);


  return {
    isListening,
    transcript,
    error,
    supported,
    isAwake,
    startListening, // General start
    stopListening,
    listenForCommand, // Specific for after wake word/button
  };
}
