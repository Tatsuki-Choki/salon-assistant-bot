
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, MessageSender, Category } from './types';
import { 
  INITIAL_SYSTEM_MESSAGE_TEXT, 
  APP_NAME, 
  CATEGORIES,
  CATEGORY_SELECTED_MESSAGE_PREFIX,
  CATEGORY_SELECTED_MESSAGE_SUFFIX
} from './constants';
import { sendMessageToGemini } from './services/geminiService';
import CategoryButton from './components/CategoryButton';
import MessageBubble from './components/MessageBubble';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentBotMessageId, setCurrentBotMessageId] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const resetConversationState = () => {
    setMessages([{
      id: Date.now().toString(),
      text: INITIAL_SYSTEM_MESSAGE_TEXT,
      sender: MessageSender.SYSTEM,
      timestamp: new Date(),
    }]);
    setCurrentCategory(null);
  }

  useEffect(() => {
    resetConversationState();
  }, []);

  const handleCategorySelect = (category: Category) => {
    if (isLoading) return;
    setCurrentCategory(category);
    const systemMessageText = `${CATEGORY_SELECTED_MESSAGE_PREFIX}${category.label}${CATEGORY_SELECTED_MESSAGE_SUFFIX}`;
    const systemMessage: Message = {
      id: `sys-${Date.now()}`,
      text: systemMessageText,
      sender: MessageSender.SYSTEM,
      timestamp: new Date(),
      categoryContext: category.label
    };
    
    setMessages(prevMessages => {
        const filteredMessages = prevMessages.filter(msg => 
            !(msg.sender === MessageSender.SYSTEM && msg.text.startsWith(CATEGORY_SELECTED_MESSAGE_PREFIX))
        );
        const messagesWithoutOldSelections = filteredMessages.length === 0 && !prevMessages.find(m => m.text === INITIAL_SYSTEM_MESSAGE_TEXT)
            ? [{id: `init-${Date.now()}`, text: INITIAL_SYSTEM_MESSAGE_TEXT, sender: MessageSender.SYSTEM, timestamp: new Date()}]
            : filteredMessages;

        return [...messagesWithoutOldSelections, systemMessage];
    });
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: userInput,
      sender: MessageSender.USER,
      timestamp: new Date(),
      categoryContext: currentCategory?.label,
    };
    
    const updatedMessagesWithUser = [...messages, userMessage];
    setMessages(updatedMessagesWithUser);
    setUserInput('');
    setIsLoading(true); // Set loading true
    
    const botMessageId = `bot-${Date.now()}`;
    setCurrentBotMessageId(botMessageId); // Set current bot message ID
    
    // Add a placeholder message for the bot's response
    const botPlaceholderMessage: Message = {
        id: botMessageId,
        text: "", // Intentionally empty initially for spinner
        sender: MessageSender.BOT,
        timestamp: new Date(),
        categoryContext: currentCategory?.label,
    };
    setMessages(prev => [...prev, botPlaceholderMessage]);


    const historyForGemini = updatedMessagesWithUser; // Pass messages before bot placeholder

    await sendMessageToGemini(
      userInput,
      historyForGemini,
      currentCategory?.promptContext ?? null,
      (chunkText) => { 
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId ? { ...msg, text: msg.text + chunkText } : msg
        ));
      },
      () => { 
        setIsLoading(false);
        setCurrentBotMessageId(null); // Clear current bot message ID
      },
      (error) => { 
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId ? { ...msg, text: `エラーが発生しました: ${error.message}` } : msg
        ));
        setIsLoading(false);
        setCurrentBotMessageId(null); // Clear current bot message ID
      }
    );
  };
  
  const handleResetConversation = () => {
    resetConversationState();
    setUserInput('');
    setIsLoading(false);
    setCurrentBotMessageId(null);
  };

  const isInputAreaDisabled = isLoading;
  const inputPlaceholder = currentCategory 
    ? `「${currentCategory.label}」について質問...` 
    : "カテゴリを選択するか、質問を入力...";

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-gray-50 shadow-2xl">
      <header className="bg-pink-500 text-white p-4 text-center shadow-md">
        <h1 className="text-xl font-bold flex items-center justify-center">
          {APP_NAME}
        </h1>
        {currentCategory && (
          <p className="text-xs mt-1">選択中のカテゴリ: {currentCategory.label}</p>
        )}
      </header>

      <main className="flex-grow p-4 overflow-y-auto bg-gray-100">
        {messages.map(msg => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            currentBotMessageId={currentBotMessageId} // Pass currentBotMessageId
          />
        ))}
        {/* This global spinner might show very briefly before currentBotMessageId is set */}
        {isLoading && !messages.find(m => m.id === currentBotMessageId && m.sender === MessageSender.BOT) && 
          <div className="flex justify-start mb-3"><LoadingSpinner /></div>
        }
        <div ref={messagesEndRef} />
      </main>
      
      <footer className="p-4 border-t border-gray-200 bg-white shadow-inner">
        <div className="mb-3">
          <div className="flex flex-wrap justify-center items-center gap-2">
            {CATEGORIES.map(cat => (
              <CategoryButton 
                key={cat.id} 
                category={cat} 
                onSelect={handleCategorySelect}
                isSelected={currentCategory?.id === cat.id}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isInputAreaDisabled && handleSendMessage()}
            placeholder={inputPlaceholder}
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={isInputAreaDisabled}
            aria-label="質問入力"
          />
          <button
            onClick={handleSendMessage}
            disabled={isInputAreaDisabled || !userInput.trim()}
            className="p-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:bg-pink-300 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50"
            aria-label="送信"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </footer>
       <button 
          onClick={handleResetConversation}
          className="w-full p-2 bg-red-500 text-white hover:bg-red-600 transition-colors text-sm"
          aria-label="ホームに戻り会話をリセット"
        >
          <i className="fas fa-home mr-1"></i> ホームに戻る
        </button>
    </div>
  );
};

export default App;