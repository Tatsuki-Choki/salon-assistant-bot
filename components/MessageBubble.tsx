import React from 'react';
import { Message, MessageSender } from '../types';
import LoadingSpinner from './LoadingSpinner'; // Import LoadingSpinner
import QuestionSuggestionComponent from './QuestionSuggestion';

interface MessageBubbleProps {
  message: Message;
  currentBotMessageId?: string | null; // Added to identify the bot message being loaded
  onSuggestionClick?: (suggestionText: string) => void; // Added for suggestion handling
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  currentBotMessageId, 
  onSuggestionClick 
}) => {
  const isUser = message.sender === MessageSender.USER;
  const isBot = message.sender === MessageSender.BOT;
  const isSystem = message.sender === MessageSender.SYSTEM;

  const bubbleAlignment = isUser ? 'justify-end' : 'justify-start';
  const bubbleColor = isUser
    ? 'bg-blue-500 text-white'
    : isBot
    ? 'bg-gray-200 text-gray-800'
    : 'bg-slate-100 text-slate-700 border border-slate-300';
  
  const wrapperClasses = `flex ${bubbleAlignment} mb-3 animate-fadeIn`;
  const bubbleClasses = `max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-xl shadow-md ${bubbleColor}`;
  
  const formatText = (text: string) => {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/\n/g, '<br />');
    return { __html: formatted };
  };

  const isActiveBotPlaceholder =
    isBot &&
    message.id === currentBotMessageId &&
    !message.text.trim();

  return (
    <div className={wrapperClasses}>
      <div className={bubbleClasses}>
        {isBot && (
           <div className="flex items-center mb-1">
            <i className="fas fa-cut text-blue-500 mr-2"></i>
            <span className="text-xs font-semibold text-blue-600">アシスタント</span>
          </div>
        )}
        {isUser && (
           <div className="flex items-center justify-end mb-1">
            <span className="text-xs font-semibold text-blue-100 mr-2">あなた</span>
            <i className="fas fa-user text-blue-200"></i>
          </div>
        )}

        {isActiveBotPlaceholder ? (
          <div className="py-2"> {/* Added padding for spinner consistency */}
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <p 
              className="text-sm leading-relaxed text-left" 
              dangerouslySetInnerHTML={formatText(message.text)}
            ></p>
            
            {/* 質問候補の表示（ボットメッセージのみ） */}
            {isBot && message.suggestions && message.suggestions.length > 0 && onSuggestionClick && (
              <QuestionSuggestionComponent
                suggestions={message.suggestions}
                onSuggestionClick={onSuggestionClick}
              />
            )}
          </>
        )}
        
        { /* Only show timestamp if not loading or if there's text */ }
        {(!isActiveBotPlaceholder || message.text.trim()) && (
          <p className="text-xs mt-2 opacity-75 text-left">
            {message.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;