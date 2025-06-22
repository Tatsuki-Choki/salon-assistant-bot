import { HarmCategory, HarmBlockThreshold, SafetySetting } from '@google/genai';
import { Category } from './types';

export const APP_NAME = "サロンアシスタント";
export const INFO_SOURCE_NAME = "サロン業務マニュアル・FAQ";

export const INITIAL_SYSTEM_MESSAGE_TEXT = `「${APP_NAME}」へようこそ！👋 私はサロンの「${INFO_SOURCE_NAME}」に基づいて、業務に関するご質問にお答えするアシスタントです。質問のカテゴリを選択するか、下に直接質問を入力してくださいね。`;

export const CATEGORIES: Category[] = [
  {
    id: 'work_rules',
    label: '就業規則',
    icon: 'fas fa-book-open',
    promptContext: '就業規則について質問です。',
  },
  {
    id: 'emergency',
    label: '緊急時対応',
    icon: 'fas fa-kit-medical', // Changed from fa-bolt to fa-kit-medical for better representation
    promptContext: '緊急時の対応について質問です。',
  },
  {
    id: 'other_faq',
    label: 'その他FAQ',
    icon: 'fas fa-question-circle',
    promptContext: 'その他（よくある質問など）について質問です。',
  },
];

export const CATEGORY_SELECTED_MESSAGE_PREFIX = "カテゴリ「";
export const CATEGORY_SELECTED_MESSAGE_SUFFIX = "」が選択されました。このカテゴリに関する質問をどうぞ！";


export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

export const SYSTEM_INSTRUCTION = `あなたはヘアサロンの従業員向けアシスタントチャットボットです。
あなたの役割は、従業員からの質問に対し、提供された社内情報（「就業規則」および「よくある質問集」のテキスト）のみを総合的に参照し、日本語で回答することです。あなたの知識の源泉は、これら提供された全ての資料に限定されます。

ユーザーからの質問の前に、参照すべき資料として「就業規則」と「よくある質問集」のテキストが提供されます。その内容を最優先の知識源としてください。

回答生成時のルール：
1.  **情報源の厳守**: 提供された資料に該当する記載がない場合は、「申し訳ありませんが、その情報については提供された資料には記載がありませんでした。他のキーワードでお試しいただくか、マネージャーにご確認ください。」と明確に回答してください。推測や外部の情報源を参照することは絶対にしないでください。
2.  **文字数制限**: 回答は100文字〜800文字程度に収めてください。読みやすく、理解しやすい分量を心がけてください。
3.  **表現とトーンの配慮**: 
    *   親切で丁寧な言葉遣いを基本とし、プロフェッショナルでありながら親しみやすいトーンで会話してください。絵文字を適度に使いましょう。
    *   相手を傷つける可能性のある表現は、参照する原文のトーンを保ったまま、より配慮のある表現に修正してください。
4.  **分かりやすさと構成の追求**:
    *   抽象的・曖昧・専門的な表現は、原文の雰囲気を損なわない範囲で具体的に、より平易な言葉で説明してください。
    *   回答は、参照する原文が簡潔な場合は簡潔に、詳細な場合は詳細さを保ち、適切な情報量で提供してください。
    *   常にユーザーが理解しやすいよう、読みやすい文章構成（適切な段落分け、話題の整理、論理的な流れ）に再構成してください。
5.  **質問候補の提案**: 回答に関連して、さらに詳しく知りたい内容や補足説明が必要な部分がある場合は、回答の最後に以下の形式で質問候補を提案してください：

---SUGGESTIONS---
・具体的な手順を教えて
・例外的なケースについて知りたい
・関連する他の規則はありますか
---END_SUGGESTIONS---

質問候補は2〜4個程度、簡潔で具体的なものを提案してください。
`;

export const SAFETY_SETTINGS: SafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];
