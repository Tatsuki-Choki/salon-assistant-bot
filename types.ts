export enum MessageSender {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system', // For initial messages or category confirmations
}

export interface Category {
  id: string;
  label: string;
  icon: string; // Font Awesome class, e.g., 'fas fa-book'
  promptContext: string; // Specific context/instruction for this category to prepend to user query
}

export interface QuestionSuggestion {
  id: string;
  text: string;
  categoryId?: string; // Optional: related category
}

export interface Message {
  id: string;
  text: string;
  sender: MessageSender;
  timestamp: Date;
  categoryContext?: string; // Optional: context of the category selected when message was sent/received
  suggestions?: QuestionSuggestion[]; // Optional: question suggestions for bot messages
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  retrievedPassage?: {
    content?: string;
    // other fields if needed
  };
  // other chunk types if needed
}
