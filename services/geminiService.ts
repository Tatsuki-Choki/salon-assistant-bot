import { GoogleGenAI, Chat, GenerateContentResponse, Part, Content } from "@google/genai";
import { GEMINI_MODEL_NAME, SYSTEM_INSTRUCTION, INFO_SOURCE_NAME, SAFETY_SETTINGS } from '../constants';
import { Message, MessageSender, QuestionSuggestion } from "../types";
import { WORK_RULES_TEXT } from '../data/workRulesContent';
import { FAQ_TEXT } from '../data/faqContent';

let ai: GoogleGenAI | null = null;

const getAIInstance = (): GoogleGenAI => {
  if (!ai) {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

// 質問候補を解析・抽出する関数
const extractSuggestions = (responseText: string): QuestionSuggestion[] => {
  const suggestionMatch = responseText.match(/---SUGGESTIONS---([\s\S]*?)---END_SUGGESTIONS---/);
  if (!suggestionMatch) return [];

  const suggestionsText = suggestionMatch[1];
  const suggestions = suggestionsText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('・') || line.startsWith('•'))
    .map((line, index) => ({
      id: `suggestion-${Date.now()}-${index}`,
      text: line.replace(/^[・•]\s*/, '').trim()
    }))
    .filter(suggestion => suggestion.text.length > 0);

  return suggestions;
};

// 質問候補部分を除去したクリーンなテキストを取得
const cleanResponseText = (responseText: string): string => {
  return responseText.replace(/---SUGGESTIONS---([\s\S]*?)---END_SUGGESTIONS---/g, '').trim();
};

const MAX_DOCUMENT_TEXT_CHARS_IN_PROMPT = 25000; // Total character limit for embedded documents

export const sendMessageToGemini = async (
  messageText: string,
  currentMessages: Message[],
  categoryPromptContext: string | null, // Added to pass category context
  onStreamChunk: (chunkText: string) => void,
  onStreamEnd: (suggestions?: QuestionSuggestion[]) => void,
  onError: (error: Error) => void
): Promise<void> => {
  const genAI = getAIInstance();

  const relevantMessages = currentMessages
    .filter(msg => msg.sender === MessageSender.USER || msg.sender === MessageSender.BOT);
  const historyForChatContent = relevantMessages.slice(-15);

  const formattedHistory: Content[] = historyForChatContent.map(msg => ({
    role: msg.sender === MessageSender.USER ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const chat: Chat = genAI.chats.create({
    model: GEMINI_MODEL_NAME,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      safetySettings: SAFETY_SETTINGS,
    },
    history: formattedHistory,
  });
  
  const preambleForAllDocs = `以下の「就業規則」および「よくある質問とその回答」の情報を総合的に参照して、質問に回答してください。あなたの知識の源泉はこれら提供された資料のみであると仮定し、ここに記載されていない情報は「提供された資料には該当する記載がありません」と明確に述べてください。\n\n`;
  
  // Conditionally construct postamble
  let postambleForAllDocs = `\n\n上記の資料を踏まえ、次の質問に回答してください：`;
  if (categoryPromptContext) {
    postambleForAllDocs = `\n\n上記の資料を踏まえ、「${categoryPromptContext}」という文脈で、次の質問に回答してください：`;
  }

  // 退職届のフォーマット質問かどうかを検出
  const isRetirementFormatQuery = messageText.includes('退職届') && (
    messageText.includes('フォーマット') || 
    messageText.includes('書き方') || 
    messageText.includes('テンプレート') || 
    messageText.includes('書式') ||
    messageText.includes('形式') ||
    messageText.includes('見本') ||
    messageText.includes('例')
  );

  if (isRetirementFormatQuery) {
    postambleForAllDocs += `\n\n※この質問は退職届のフォーマットに関するものです。資料に含まれている具体的なテンプレートやフォーマット例を詳細に提供してください。`;
  }

  // Calculate available characters for documents
  const userQueryLength = (categoryPromptContext ? categoryPromptContext.length + 2 : 0) + messageText.length;
  const approximateOtherChars = preambleForAllDocs.length + postambleForAllDocs.length + userQueryLength + 200; // Safety margin
  let availableCharsForDocumentsCombined = MAX_DOCUMENT_TEXT_CHARS_IN_PROMPT - approximateOtherChars;
  if (availableCharsForDocumentsCombined < 0) availableCharsForDocumentsCombined = 0;

  // Allocate budget (e.g., 50/50, or adjust based on typical length if known)
  const charsForWorkRules = Math.floor(availableCharsForDocumentsCombined * 0.5);
  const charsForFaq = Math.floor(availableCharsForDocumentsCombined * 0.5);

  let effectiveWorkRulesText = WORK_RULES_TEXT;
  let workRulesTruncationInfo = "";
  if (WORK_RULES_TEXT.length > charsForWorkRules && charsForWorkRules > 0) {
    effectiveWorkRulesText = WORK_RULES_TEXT.substring(0, charsForWorkRules);
    workRulesTruncationInfo = `\n...(注: 「就業規則」の全文は長いため、冒頭約${Math.round(charsForWorkRules / 1000)}k文字のみを提供)...`;
  } else if (charsForWorkRules <= 0 && WORK_RULES_TEXT.length > 0) {
    effectiveWorkRulesText = WORK_RULES_TEXT.substring(0, Math.min(WORK_RULES_TEXT.length, 100)); // Minimal snippet
    workRulesTruncationInfo = `\n...(注: 「就業規則」の全文は長いため、ごく一部のみを提供)...`;
  }


  let effectiveFaqText = FAQ_TEXT;
  let faqTruncationInfo = "";
  if (FAQ_TEXT.length > charsForFaq && charsForFaq > 0) {
    effectiveFaqText = FAQ_TEXT.substring(0, charsForFaq);
    faqTruncationInfo = `\n...(注: 「よくある質問とその回答」の全文は長いため、冒頭約${Math.round(charsForFaq / 1000)}k文字のみを提供)...`;
  } else if (charsForFaq <= 0 && FAQ_TEXT.length > 0) {
    effectiveFaqText = FAQ_TEXT.substring(0, Math.min(FAQ_TEXT.length, 100)); // Minimal snippet
    faqTruncationInfo = `\n...(注: 「よくある質問とその回答」の全文は長いため、ごく一部のみを提供)...`;
  }
  
  const contextPartText = `${preambleForAllDocs}--- 就業規則 (抜粋または全文) ---\n${effectiveWorkRulesText}${workRulesTruncationInfo}\n--- 就業規則ここまで ---\n\n--- よくある質問とその回答 (抜粋または全文) ---\n${effectiveFaqText}${faqTruncationInfo}\n--- よくある質問とその回答ここまで ---${postambleForAllDocs}`;
  
  // Prepend category context to user's message if available
  const finalMessageText = categoryPromptContext ? `${categoryPromptContext} ${messageText}` : messageText;
  
  const messagePayload: Part[] = [{ text: contextPartText + "\n" + finalMessageText }];

  let fullResponseText = '';
  let displayedText = '';

  try {
    const result = await chat.sendMessageStream({ message: messagePayload });
    for await (const chunk of result) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullResponseText += chunkText;
        
        // 質問候補マークアップが含まれているかチェック
        if (fullResponseText.includes('---SUGGESTIONS---')) {
          // 質問候補マークアップ以前の部分のみを取得
          const textBeforeSuggestions = fullResponseText.split('---SUGGESTIONS---')[0].trim();
          
          // まだ表示されていない部分があれば表示
          if (textBeforeSuggestions.length > displayedText.length) {
            const newText = textBeforeSuggestions.substring(displayedText.length);
            displayedText = textBeforeSuggestions;
            onStreamChunk(newText);
          }
          // 質問候補マークアップが検出されたら、以降のストリーミング表示は停止
        } else {
          // 質問候補マークアップがまだない場合は通常通り表示
          onStreamChunk(chunkText);
          displayedText += chunkText;
        }
      }
    }
    
    // 完了時に質問候補を抽出
    const suggestions = extractSuggestions(fullResponseText);
    onStreamEnd(suggestions);
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    onError(error instanceof Error ? error : new Error('An unknown error occurred with Gemini API.'));
  }
};

export const generateContent = async (prompt: string): Promise<string> => {
  const genAI = getAIInstance();
  try {
    const response: GenerateContentResponse = await genAI.models.generateContent({
        model: GEMINI_MODEL_NAME, 
        contents: prompt,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION, 
            safetySettings: SAFETY_SETTINGS,
        }
    });
    return response.text || '';
  } catch (error) {
    console.error("Error generating content from Gemini:", error);
    return `Error: ${INFO_SOURCE_NAME}からの応答取得に失敗しました。`;
  }
};
