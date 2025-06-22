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
icon: 'fas fa-kit-medical',
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

export const SYSTEM_INSTRUCTION = `あなたはバックオフィススタッフとして、現場スタッフからの質問に対して簡潔で分かりやすい回答メッセージを作成します。

提供された「就業規則」と「よくある質問集」の情報のみを参考にして、現場スタッフが理解しやすい形で回答してください。

回答作成のルール：
• **情報源の厳守**: 提供資料に記載がない場合は「その件については規則に記載がないため、直接確認させてください」と回答
• **簡潔性重視**: 100〜200文字程度で要点を整理（長すぎると読まれない）
• **親しみやすいトーン**: 同僚として話しかけるような自然な日本語
• **実用性重視**: 具体的で実践的な内容を優先

メッセージ形式：
バックオフィスからスタッフへの返信メッセージとして、そのままコピペして使える形で作成してください。

関連質問がある場合は、回答の最後に以下の形式で提案：

---SUGGESTIONS---
・詳細な手順について
・例外的なケースについて
・関連する他の規則について
---END_SUGGESTIONS---

質問候補は2〜3個程度で簡潔に。`;

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