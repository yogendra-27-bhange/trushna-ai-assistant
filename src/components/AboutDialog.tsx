
// src/components/AboutDialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { GithubIcon, Bot, BrainCircuit, Palette, Settings, Sparkles, Speech, Timer, Send, Globe, Zap } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface AboutDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const features = [
  {
    icon: <BrainCircuit className="w-5 h-5 text-primary" />,
    title: "Intelligent Conversation",
    description:
      "Powered by advanced AI (Google's Gemini via Genkit), Trushna understands context, remembers recent parts of your conversation, and provides relevant responses.",
  },
  {
    icon: <Speech className="w-5 h-5 text-primary" />,
    title: "Voice Interaction",
    description:
      "Speak your commands using the microphone button. Trushna also provides spoken replies for most interactions.",
  },
  {
    icon: <Zap className="w-5 h-5 text-primary" />,
    title: "Activation Phrase",
    description:
      "After pressing the microphone button, say \"Hey Trushna\" to activate full command listening. You'll get a toast notification and the input placeholder will update.",
  },
  {
    icon: <Sparkles className="w-5 h-5 text-primary" />,
    title: "Personalized Greetings",
    description:
      "Starts the day with a friendly, time-appropriate greeting upon first load.",
  },
  {
    icon: <Timer className="w-5 h-5 text-primary" />,
    title: "Reminders",
    description:
      'Set reminders like "Remind me to take a break in 10 minutes" or "Set reminder to call mom later." Trushna confirms and notifies you with an alert and sound when it\'s due.',
  },
  {
    icon: <Send className="w-5 h-5 text-primary" />,
    title: "Productivity & Information",
    description:
      'Get the current time/date ("What\'s the time?") or draft messages ("Send message to [email] saying [your message]") which opens your default email client.',
  },
  {
    icon: <Globe className="w-5 h-5 text-primary" />,
    title: "Web Navigation & Search",
    description:
      'Quickly open sites ("Open YouTube," "Open Gmail"), specific URLs ("Open google.com"), search YouTube ("Play [song]" or "Search [topic] on YouTube"), or perform general web searches ("Search for [query]"). Trushna warns about pop-up blockers.',
  },
  {
    icon: <Palette className="w-5 h-5 text-primary" />,
    title: "Customizable Interface",
    description:
      "Choose from Light, Dark, Cyberpunk, Glassmorphism, and Solarized themes. Your preferences, chat history, and reminders are saved locally in your browser.",
  },
  {
    icon: <Settings className="w-5 h-5 text-primary" />,
    title: "Chat Management",
    description:
      "Clear current chat history or start a completely new chat session. Messages auto-scroll to the latest entry.",
  },
];

export function AboutDialog({ isOpen, onOpenChange }: AboutDialogProps) {
  const { theme } = useTheme();
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-xl max-h-[80vh] flex flex-col overflow-hidden", // Added overflow-hidden
        theme === "cyberpunk" ? "cyberpunk:cyber-border" : "",
        theme === "glassmorphism" ? "glassmorphism:glass-ui-element" : ""
      )}>
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className={cn("text-2xl flex items-center gap-2", theme === "cyberpunk" || theme === "glassmorphism" ? "glow-primary-text" : "")}>
            <Bot className="w-7 h-7" /> About Trushna Assistant
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            Trushna is your versatile AI-powered virtual assistant, designed for intuitive interaction and productivity.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow mb-0">
          <div className="space-y-6 px-6 py-2">
            <section>
              <h3 className={cn("text-lg font-semibold mb-3 text-primary", theme === "cyberpunk" || theme === "glassmorphism" ? "glow-primary-text" : "")}>
                Key Features
              </h3>
              <ul className="space-y-3 text-sm">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">{feature.icon}</div>
                    <div>
                      <strong className="text-foreground">{feature.title}:</strong>{" "}
                      <span className="text-muted-foreground">{feature.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className={cn("text-lg font-semibold mb-3 text-primary", theme === "cyberpunk" || theme === "glassmorphism" ? "glow-primary-text" : "")}>
                Developers
              </h3>
              <div className="space-y-2 text-sm">
                 <div className="flex items-center gap-2">
                  <GithubIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a
                    href="https://github.com/trushna-888"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("text-accent hover:underline", theme === "cyberpunk" || theme === "glassmorphism" ? "hover:glow-accent-text" : "")}
                  >
                    Trushna Bankar (github.com/trushna-888)
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <GithubIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a
                    href="https://github.com/yogendra-27-bhange"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("text-accent hover:underline", theme === "cyberpunk" || theme === "glassmorphism" ? "hover:glow-accent-text" : "")}
                  >
                    Yogendra Bhange (github.com/yogendra-27-bhange)
                  </a>
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t border-border">
          <Button onClick={() => onOpenChange(false)} variant={theme === "cyberpunk" || theme === "glassmorphism" ? "outline" : "default"} className={cn(theme === "cyberpunk" || theme === "glassmorphism" ? "glow-primary-box" : "")}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
