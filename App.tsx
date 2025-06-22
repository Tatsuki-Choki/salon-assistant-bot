import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, MessageSender, Category, QuestionSuggestion } from './types';
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
  const [showCategories, setShowCategories] = useState<boolean>(true);

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
    
    // カテゴリの選択解除機能
    if (currentCategory?.id === category.id) {
      setCurrentCategory(null);
      // カテゴリ解除のシステムメッセージを削除
      setMessages((prevMessages: Message[]) => {
        const filteredMessages = prevMessages.filter((msg: Message) => 
          !(msg.sender === MessageSender.SYSTEM && msg.text.startsWith(CATEGORY_SELECTED_MESSAGE_PREFIX))
        );
        return filteredMessages.length === 0 
          ? [{id: `init-${Date.now()}`, text: INITIAL_SYSTEM_MESSAGE_TEXT, sender: MessageSender.SYSTEM, timestamp: new Date()}]
          : filteredMessages;
      });
      return;
    }

    setCurrentCategory(category);
    const systemMessageText = `${CATEGORY_SELECTED_MESSAGE_PREFIX}${category.label}${CATEGORY_SELECTED_MESSAGE_SUFFIX}`;
    const systemMessage: Message = {
      id: `sys-${Date.now()}`,
      text: systemMessageText,
      sender: MessageSender.SYSTEM,
      timestamp: new Date(),
      categoryContext: category.label
    };
    
    setMessages((prevMessages: Message[]) => {
        const filteredMessages = prevMessages.filter((msg: Message) => 
            !(msg.sender === MessageSender.SYSTEM && msg.text.startsWith(CATEGORY_SELECTED_MESSAGE_PREFIX))
        );
        const messagesWithoutOldSelections = filteredMessages.length === 0 && !prevMessages.find((m: Message) => m.text === INITIAL_SYSTEM_MESSAGE_TEXT)
            ? [{id: `init-${Date.now()}`, text: INITIAL_SYSTEM_MESSAGE_TEXT, sender: MessageSender.SYSTEM, timestamp: new Date()}]
            : filteredMessages;

        return [...messagesWithoutOldSelections, systemMessage];
    });
  };

  // 質問候補がクリックされた時の処理
  const handleSuggestionClick = (suggestionText: string) => {
    setUserInput(suggestionText);
    // 自動的に質問を送信
    setTimeout(() => {
      handleSendMessage(suggestionText);
    }, 100);
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || userInput;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: MessageSender.USER,
      timestamp: new Date(),
      categoryContext: currentCategory?.label,
    };
    
    const updatedMessagesWithUser = [...messages, userMessage];
    setMessages(updatedMessagesWithUser);
    setUserInput('');
    setIsLoading(true); // Set loading true
    
    // 回答出力時にカテゴリを非表示にする
    setShowCategories(false);
    
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
    setMessages((prev: Message[]) => [...prev, botPlaceholderMessage]);


    const historyForGemini = updatedMessagesWithUser; // Pass messages before bot placeholder

    await sendMessageToGemini(
      textToSend,
      historyForGemini,
      currentCategory?.promptContext ?? null,
      (chunkText) => { 
        setMessages((prev: Message[]) => prev.map((msg: Message) => 
          msg.id === botMessageId ? { ...msg, text: msg.text + chunkText } : msg
        ));
      },
      (suggestions?: QuestionSuggestion[]) => { 
        // 最終的な回答に質問候補を追加
        setMessages((prev: Message[]) => prev.map((msg: Message) => 
          msg.id === botMessageId ? { ...msg, suggestions: suggestions || [] } : msg
        ));
        setIsLoading(false);
        setCurrentBotMessageId(null); // Clear current bot message ID
      },
      (error) => { 
        setMessages((prev: Message[]) => prev.map((msg: Message) => 
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

  const toggleCategories = () => {
    setShowCategories(!showCategories);
  };

  const isInputAreaDisabled = isLoading;
  const inputPlaceholder = currentCategory 
    ? `「${currentCategory.label}」について質問...` 
    : "カテゴリを選択するか、質問を入力...";

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-gray-50 shadow-2xl">
      {/* 固定ヘッダー */}
      <header className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-2xl bg-pink-500 text-white p-4 text-center shadow-md z-10">
        <h1 className="text-xl font-bold flex items-center justify-center">
          {APP_NAME}
        </h1>
        {currentCategory && (
          <p className="text-xs mt-1">選択中のカテゴリ: {currentCategory.label}</p>
        )}
      </header>

      {/* メインチャットエリア（上下に余白を設けてスクロール可能） */}
      <main className="flex-grow overflow-y-auto bg-gray-100 pt-20 pb-32">
        <div className="p-4">
          {messages.map(msg => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              currentBotMessageId={currentBotMessageId}
              onSuggestionClick={handleSuggestionClick}
            />
          ))}
          {/* This global spinner might show very briefly before currentBotMessageId is set */}
          {isLoading && !messages.find(m => m.id === currentBotMessageId && m.sender === MessageSender.BOT) && 
            <div className="flex justify-start mb-3"><LoadingSpinner /></div>
          }
          <div ref={messagesEndRef} />
        </div>
      </main>
      
      {/* 固定フッター */}
      <footer className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-2xl bg-white border-t border-gray-200 shadow-inner z-10">
        {/* カテゴリエリア（条件付き表示） */}
        {showCategories && (
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {/* カテゴリボタン群 */}
              <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide">
                {CATEGORIES.map(cat => (
                  <CategoryButton 
                    key={cat.id} 
                    category={cat} 
                    onSelect={handleCategorySelect}
                    isSelected={currentCategory?.id === cat.id}
                  />
                ))}
              </div>
              
              {/* カテゴリ隠すボタン */}
              <button
                onClick={toggleCategories}
                className="ml-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200 flex-shrink-0"
                aria-label="カテゴリを隠す"
                title="カテゴリを隠す"
              >
                <i className="fas fa-chevron-down"></i>
              </button>
            </div>
          </div>
        )}

        {/* カテゴリが隠れている時の表示ボタン */}
        {!showCategories && (
          <div className="px-4 pt-2">
            <button
              onClick={toggleCategories}
              className="w-full p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 text-sm flex items-center justify-center gap-2"
              aria-label="カテゴリを表示"
            >
              <i className="fas fa-chevron-up"></i>
              カテゴリを表示
            </button>
          </div>
        )}

        {/* 入力エリア */}
        <div className="p-4">
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
              onClick={() => handleSendMessage()}
              disabled={isInputAreaDisabled || !userInput.trim()}
              className="p-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:bg-pink-300 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50"
              aria-label="送信"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>

        {/* リセットボタン */}
        <button 
          onClick={handleResetConversation}
          className="w-full p-2 bg-red-500 text-white hover:bg-red-600 transition-colors text-sm"
          aria-label="ホームに戻り会話をリセット"
        >
          <i className="fas fa-home mr-1"></i> ホームに戻る
        </button>
      </footer>
    </div>
  );
};

export default App;