
// src/lib/commandParser.ts

export interface ParsedCommand {
  type:
    | 'reminder'
    | 'weather'
    | 'send_message'
    | 'open_url'
    | 'greeting'
    | 'farewell'
    | 'get_time'
    | 'get_date'
    | 'open_youtube'
    | 'play_song_youtube'
    | 'search_youtube' // New command type
    | 'browser_search'
    | 'open_gmail'
    | 'open_google'
    | 'open_chatgpt'
    | 'open_brave'
    | 'unknown';
  payload?: any;
  originalCommand: string;
}

const reminderRegex = /set(?: an?| the)? reminder(?: to)?\s+(.+?)(?:\s+(?:at|in|for)\s+(.+))?$/i;
const weatherRegex = /what(?:'s| is) the weather(?: like)?(?: in (.+))?/i;
const messageRegex = /send (?:a )?message(?: to (.+?))?(?: (?:saying|that says|content|body|text)\s+(.+))?$/i;
const openUrlRegex = /open (?:url |website )?(https?:\/\/[^\s]+)/i;
const openUrlSimpleRegex = /open ([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?(?:\/[^\s]*)?)/i; // Catches domain.com or domain.com/path
const greetingRegex = /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)(?: trushna)?/i;
const farewellRegex = /^(bye|goodbye|see you|later|farewell)(?: trushna)?/i;
// Updated timeRegex to be more flexible
const timeRegex = /(?:what(?:'s|s| is)?(?: the)?|tell me the|current|wats the)\s*time(?: now)?/i;
// Updated dateRegex to be more flexible
const dateRegex = /(?:what(?:'s|s| is)? (?:the )?(?:current )?(date|day)|today(?:'s|s)?\s*date)/i;
const openYouTubeRegex = /^open youtube$/i;
const playSongYouTubeRegex = /^(play|stream)\s+(?:song\s+)?(.+?)(?:\s+on\s+youtube)?$/i;
const searchYouTubeRegex = /^search\s+(.+?)\s+on\s+youtube$/i; 
const browserSearchRegex = /^(search|find)(?:\s+(?:for|about))?\s+(.+?)(?:\s+on\s+(?:browser|google|web))?$/i;
const openGmailRegex = /^open gmail$/i;
const openGoogleRegex = /^open google$/i;
const openChatGptRegex = /^open chatgpt$/i;
const openBraveRegex = /^open brave$/i;


export function parseCommand(command: string): ParsedCommand {
  const lowerCommand = command.toLowerCase().trim();

  let match = lowerCommand.match(reminderRegex);
  if (match) {
    return {
      type: 'reminder',
      payload: { task: match[1].trim(), timeRaw: match[2] ? match[2].trim() : 'later' },
      originalCommand: command,
    };
  }

  match = lowerCommand.match(weatherRegex);
  if (match) {
    return { type: 'weather', payload: { location: match[1] ? match[1].trim() : 'current location' }, originalCommand: command };
  }

  match = lowerCommand.match(messageRegex);
  if (match) {
    return { 
      type: 'send_message', 
      payload: { 
        to: match[1] ? match[1].trim() : undefined, 
        body: match[2] ? match[2].trim() : undefined 
      },
      originalCommand: command 
    };
  }

  match = lowerCommand.match(openYouTubeRegex);
  if (match) {
    return { type: 'open_youtube', originalCommand: command };
  }

  match = lowerCommand.match(playSongYouTubeRegex);
  if (match) {
    return { type: 'play_song_youtube', payload: { songName: match[2].trim() }, originalCommand: command };
  }

  match = lowerCommand.match(searchYouTubeRegex);
  if (match) {
    return { type: 'search_youtube', payload: { query: match[1].trim() }, originalCommand: command };
  }

  match = lowerCommand.match(browserSearchRegex);
  if (match) {
    return { type: 'browser_search', payload: { query: match[2].trim() }, originalCommand: command };
  }

  match = lowerCommand.match(openGmailRegex);
  if (match) {
    return { type: 'open_gmail', originalCommand: command };
  }

  match = lowerCommand.match(openGoogleRegex);
  if (match) {
    return { type: 'open_google', originalCommand: command };
  }

  match = lowerCommand.match(openChatGptRegex);
  if (match) {
    return { type: 'open_chatgpt', originalCommand: command };
  }

  match = lowerCommand.match(openBraveRegex);
  if (match) {
    return { type: 'open_brave', originalCommand: command };
  }
 
  match = lowerCommand.match(openUrlRegex);
  if (match) {
    return { type: 'open_url', payload: { url: match[1] }, originalCommand: command };
  }
  
  match = lowerCommand.match(openUrlSimpleRegex);
  if (match) {
    let url = match[1];
    if (!url.includes('.') || url.split('.').length < 2) {
        // This is a simple heuristic, might need refinement
    } else {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // url = 'https://' + url; // This line was previously here, but it's better to do this check in TrushnaAssistant.tsx
        }
        return { type: 'open_url', payload: { url }, originalCommand: command };
    }
  }

  match = lowerCommand.match(greetingRegex);
  if (match) {
    return { type: 'greeting', originalCommand: command };
  }

  match = lowerCommand.match(farewellRegex);
  if (match) {
    return { type: 'farewell', originalCommand: command };
  }

  match = lowerCommand.match(timeRegex);
  if (match) {
    return { type: 'get_time', originalCommand: command };
  }

  match = lowerCommand.match(dateRegex);
  if (match) {
    return { type: 'get_date', originalCommand: command };
  }

  return { type: 'unknown', payload: { command }, originalCommand: command };
}
