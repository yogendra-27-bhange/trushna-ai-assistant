
// src/components/TrushnaAssistant.tsx
"use client";

import { generateResponse } from "@/ai/flows/generate-response";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/contexts/ThemeContext";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { parseCommand } from "@/lib/commandParser";
import { cn } from "@/lib/utils";
import { Bot, Loader2, Mic, MicOff, Send, User } from "lucide-react";
import { FormEvent, useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export interface Reminder {
  id: string;
  task: string;
  dueTime: number;
  originalCommand: string;
  notified: boolean;
}

interface TrushnaAssistantProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  initialGreetingSpoken: boolean;
  setInitialGreetingSpoken: React.Dispatch<React.SetStateAction<boolean>>;
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  addMessage: (sender: "user" | "assistant", text: string) => void;
}

const MAX_HISTORY_MESSAGES = 6; // Approx 3 user & 3 assistant turns

export function TrushnaAssistant({
  messages,
  // setMessages, // No longer directly used here for adding, use addMessage prop
  initialGreetingSpoken,
  setInitialGreetingSpoken,
  reminders,
  setReminders,
  addMessage,
}: TrushnaAssistantProps) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { theme } = useTheme();

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { speak, isSpeaking, voicesReady } = useSpeechSynthesis({
    onEnd: () => console.log("Speech finished"),
  });

  useEffect(() => {
    if (voicesReady && !initialGreetingSpoken && messages.length === 0) {
      const timerId = setTimeout(() => {
        const currentHour = new Date().getHours();
        let timeGreeting = "";
        if (currentHour < 12) {
          timeGreeting = "Good morning";
        } else if (currentHour < 18) {
          timeGreeting = "Good afternoon";
        } else {
          timeGreeting = "Good evening";
        }
        const greeting = `${timeGreeting}, hi trushna here.`;
        speak(greeting);
        addMessage("assistant", greeting);
        setInitialGreetingSpoken(true);
      }, 200);

      return () => clearTimeout(timerId);
    }
  }, [speak, voicesReady, initialGreetingSpoken, setInitialGreetingSpoken, addMessage, messages.length]);


  const processAndRespond = async (commandText: string) => {
    if (!commandText.trim()) {
      setIsLoading(false); // Ensure loading is reset if command is empty
      return;
    }
    const userMessageContent = commandText;
    addMessage("user", userMessageContent);
    setIsLoading(true);
    setInputValue(""); // Clear input after processing

    const parsedCommand = parseCommand(userMessageContent);
    let responseText = "";

    const handleBlockedPopup = (actionName: string) => {
      responseText = `I tried to ${actionName}, but it seems your browser blocked it. Please check your pop-up settings.`;
      toast({
        title: "Action Blocked",
        description: `Could not ${actionName}. Your browser might have blocked the pop-up. Please check your settings.`,
        variant: "destructive",
        duration: 7000,
      });
    };

    switch (parsedCommand.type) {
      case "greeting":
        const greetings = ["Hello there!", "Hi! How can I help you today?", "Hey! What's up?"];
        responseText = greetings[Math.floor(Math.random() * greetings.length)];
        break;
      case "farewell":
        const farewells = ["Goodbye!", "See you later!", "Catch you on the flip side!"];
        responseText = farewells[Math.floor(Math.random() * farewells.length)];
        break;
      case "reminder":
        const { task, timeRaw } = parsedCommand.payload;
        let due = Date.now() + 5 * 60 * 1000; 
        let confirmationTimePhrase = 'soon';

        const timeMatch = timeRaw.match(/(\d+)\s*(minute|hour)s?/i);
        if (timeMatch) {
            const amount = parseInt(timeMatch[1]);
            const unit = timeMatch[2].toLowerCase();
            if (unit === 'minute') {
                due = Date.now() + amount * 60 * 1000;
                confirmationTimePhrase = `in ${amount} minute${amount > 1 ? 's' : ''}`;
            } else if (unit === 'hour') {
                due = Date.now() + amount * 60 * 60 * 1000;
                confirmationTimePhrase = `in ${amount} hour${amount > 1 ? 's' : ''}`;
            }
        } else if (timeRaw.toLowerCase() !== 'later' && timeRaw.toLowerCase() !== 'soon') {
             confirmationTimePhrase = `for ${timeRaw}`;
        }


        const newReminder: Reminder = { id: crypto.randomUUID(), task, dueTime: due, originalCommand: userMessageContent, notified: false };
        setReminders(prev => [...prev, newReminder]);
        responseText = `Okay, I've set a reminder for: ${task} ${confirmationTimePhrase}.`;
        toast({ title: "Reminder Set", description: `${task} ${confirmationTimePhrase}` });
        break;
      case "weather":
        responseText = "I can't check the actual weather right now, but I hope it's nice where you are!";
        break;
      case "send_message":
        const { to, body } = parsedCommand.payload;
        if (to && body) {
          window.open(`mailto:${to}?subject=Message from Trushna&body=${encodeURIComponent(body)}`);
          responseText = `I've opened your email client to send a message to ${to}.`;
        } else if (body) {
           window.open(`mailto:?subject=Message from Trushna&body=${encodeURIComponent(body)}`);
           responseText = `I've opened your email client with the message. Please specify recipient.`;
        } else {
          responseText = "I can help draft a message. Who is it for and what should it say?";
        }
        break;
      case "open_url":
        try {
          let urlToOpen = parsedCommand.payload.url;
          if (!/^https?:\/\//i.test(urlToOpen)) {
            urlToOpen = 'https://' + urlToOpen;
          }
          responseText = `Opening ${urlToOpen}...`;
          if (!window.open(urlToOpen, "_blank")) {
            handleBlockedPopup(`open ${urlToOpen}`);
          }
        } catch (e) {
          responseText = `Sorry, I couldn't open that URL. Is it valid?`;
        }
        break;
      case "get_time":
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        responseText = `The current time is ${currentTime}.`;
        break;
      case "get_date":
        const currentDate = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        responseText = `Today is ${currentDate}.`;
        break;
      case "open_youtube":
        responseText = "Opening YouTube...";
        if (!window.open("https://youtube.com", "_blank")) {
          handleBlockedPopup("open YouTube");
        }
        break;
      case "play_song_youtube":
        const songName = parsedCommand.payload.songName;
        responseText = `Searching for "${songName}" on YouTube...`;
        const songSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(songName + " song")}`;
        if (!window.open(songSearchUrl, "_blank")) {
          handleBlockedPopup(`search for "${songName}" on YouTube`);
        }
        break;
      case "search_youtube": 
        const youtubeQuery = parsedCommand.payload.query;
        responseText = `Searching for "${youtubeQuery}" on YouTube...`;
        const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`;
        if (!window.open(youtubeSearchUrl, "_blank")) {
          handleBlockedPopup(`search for "${youtubeQuery}" on YouTube`);
        }
        break;
      case "browser_search":
        const browserQuery = parsedCommand.payload.query;
        responseText = `Searching for "${browserQuery}"...`;
        const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(browserQuery)}`;
        if (!window.open(googleSearchUrl, "_blank")) {
          handleBlockedPopup(`search for "${browserQuery}"`);
        }
        break;
      case "open_gmail":
        responseText = "Opening Gmail...";
        if (!window.open("https://mail.google.com", "_blank")) {
          handleBlockedPopup("open Gmail");
        }
        break;
      case "open_google":
        responseText = "Opening Google...";
        if (!window.open("https://google.com", "_blank")) {
          handleBlockedPopup("open Google");
        }
        break;
      case "open_chatgpt":
        responseText = "Opening ChatGPT...";
        if (!window.open("https://chat.openai.com", "_blank")) {
          handleBlockedPopup("open ChatGPT");
        }
        break;
      case "open_brave":
        responseText = "Opening Brave Search...";
        if (!window.open("https://search.brave.com", "_blank")) {
          handleBlockedPopup("open Brave Search");
        }
        break;
      default:
        try {
          const historyForAI = messages.slice(-MAX_HISTORY_MESSAGES);

          const chatHistoryString = historyForAI
            .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
            .join('\\n');

          const aiResponse = await generateResponse({ command: userMessageContent, chatHistory: chatHistoryString });
          responseText = aiResponse.response;
        } catch (error) {
          console.error("AI response error:", error);
          responseText = "Sorry, I had a little trouble thinking about that. Can you try again?";
           toast({ title: "AI Error", description: "Could not get response from AI.", variant: "destructive"});
        }
    }

    addMessage("assistant", responseText);
    speak(responseText);
    setIsLoading(false);
  };

  const {
    isListening: isMicListening,
    transcript,
    error: micError,
    supported: micSupported,
    startListening: startMicListening,
    stopListening: stopMicListening,
    isAwake, // Get isAwake state from the hook
  } = useSpeechRecognition({
    wakeWord: "hey trushna",
    onWakeWord: () => {
      toast({ title: "Trushna Activated!", description: "Listening for your command...", duration: 3000 });
      setInputValue(''); // Clear any wake word from input
    },
    onCommand: (command) => {
      // processAndRespond will be called with the command (excluding wake word)
      if (command) {
        // No need to setInputValue(command) here as processAndRespond clears it.
        processAndRespond(command);
      }
      // stopListening(); // stopListening is often called internally by the hook upon command finalization
    },
    onResult: (interimOrFinalTranscript) => {
        // Update input field with live transcript if not in "awake" command mode
        // or if we want to show command being typed after wake word
        if (isMicListening) {
             if (isAwake && interimOrFinalTranscript) {
                setInputValue(interimOrFinalTranscript); // Show command as it's being spoken
             } else if (!isAwake && interimOrFinalTranscript.toLowerCase().includes("hey trushna")) {
                // Don't show "hey trushna" itself in the input
             } else if (!isAwake) {
                setInputValue(interimOrFinalTranscript);
             }
        }
    },
    onError: (err) => {
      toast({ title: "Microphone Error", description: err, variant: "destructive" });
      // stopListening(); // ensure it stops
    },
  });

  // This effect is slightly redundant if onResult handles it, but can be a fallback.
  // useEffect(() => {
  //   if (isMicListening && transcript && !isAwake) { // Only update input if not in "command after wake word" mode
  //     setInputValue(transcript);
  //   }
  // }, [transcript, isMicListening, isAwake]);


  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    processAndRespond(inputValue.trim());
  };

  const handleMicToggle = () => {
    if (!micSupported) {
        toast({ title: "Unsupported", description: "Speech recognition is not supported in your browser.", variant: "destructive"});
        return;
    }
    if (isMicListening) {
      stopMicListening();
       // If something was transcribed before stopping, process it (unless it was just the wake word phase)
      if (inputValue.trim() && !isAwake) { // or if inputValue is not just the wake word
        processAndRespond(inputValue.trim());
      } else if (isAwake && inputValue.trim()) { // If command was being typed after wake word
        processAndRespond(inputValue.trim());
      }
      setInputValue(''); // Clear input on stop
    } else {
      setInputValue(''); // Clear input before starting
      startMicListening();
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const { scrollHeight, clientHeight } = scrollAreaRef.current;
      scrollAreaRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      reminders.forEach(r => {
        if (!r.notified && now >= r.dueTime) {
          speak(`Reminder: ${r.task}`);
          toast({
            title: "Reminder!",
            description: r.task,
            duration: 10000,
          });
          setReminders(prev => prev.map(reminder => reminder.id === r.id ? {...reminder, notified: true} : reminder));
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [reminders, speak, toast, setReminders]);

  const assistantIcon = <Bot className="w-8 h-8 text-primary flex-shrink-0 drop-shadow-glow-primary" />;
  const userIcon = <User className="w-8 h-8 text-accent flex-shrink-0 drop-shadow-glow-accent" />;

  const getPlaceholderText = () => {
    if (isMicListening) {
      return isAwake ? "Say your command..." : "Listening for 'Hey Trushna'...";
    }
    return "Ask Trushna anything...";
  };

  return (
    <div className={cn("flex flex-col h-full p-2 md:p-4")}>
      <ScrollArea className="flex-grow mb-4 pr-2 md:pr-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-start gap-3 max-w-[85%] md:max-w-[75%] animate-fade-in-scale",
                msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              {msg.sender === "assistant" ? assistantIcon : userIcon}
              <div
                className={cn(
                  "rounded-xl px-4 py-3 text-sm md:text-base shadow-md",
                  msg.sender === "user"
                    ? "bg-accent/80 text-accent-foreground rounded-br-none"
                    : "bg-primary/80 text-primary-foreground rounded-bl-none",
                  theme === 'cyberpunk' && msg.sender === 'user' ? 'border border-accent glow-accent-box' : '',
                  theme === 'cyberpunk' && msg.sender === 'assistant' ? 'border border-primary glow-primary-box' : '',
                  theme === 'glassmorphism' ? 'frosted-glass' : ''
                )}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <p className="text-xs opacity-60 mt-1 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3 max-w-[85%] md:max-w-[75%] mr-auto animate-fade-in-scale">
              {assistantIcon}
              <div className={cn(
                "rounded-xl px-4 py-3 text-sm md:text-base shadow-md bg-primary/80 text-primary-foreground rounded-bl-none",
                 theme === 'cyberpunk' ? 'border border-primary glow-primary-box' : '',
                 theme === 'glassmorphism' ? 'frosted-glass' : ''
                )}>
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <form onSubmit={handleSubmit} className={cn(
          "flex items-center gap-2 md:gap-4 p-2 rounded-lg border bg-card shadow-xl relative overflow-hidden",
          theme === 'cyberpunk' ? 'cyberpunk:cyber-border' : '',
          theme === 'glassmorphism' ? 'frosted-glass' : ''
        )}>
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={getPlaceholderText()}
          className="flex-grow bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base md:text-lg placeholder:text-muted-foreground"
          disabled={isLoading}
          aria-label="Command input"
        />
        <Button
          type="button"
          size="icon"
          onClick={handleMicToggle}
          disabled={isLoading || !micSupported}
          variant="ghost"
          className={cn("rounded-full hover:bg-primary/20", isMicListening ? "text-destructive animate-pulse-glow" : "text-primary", (theme === 'cyberpunk' || theme === 'glassmorphism') && !isMicListening ? 'glow-primary-text' : '')}
          aria-label={isMicListening ? "Stop listening" : "Start listening"}
        >
          {isMicListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </Button>
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !inputValue.trim()}
          className={cn("rounded-full bg-primary text-primary-foreground hover:bg-primary/80", (theme === 'cyberpunk' || theme === 'glassmorphism') ? 'glow-primary-box' : '')}
          aria-label="Send command"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </Button>
      </form>
       {micError && <p className="text-xs text-destructive mt-1 text-center">{micError}</p>}
    </div>
  );
}
