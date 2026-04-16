/**
 * Chatbot block — thin loader that delegates to the hosted chatbot.
 * All chatbot logic and CSS live at the remote URL below.
 */
const CHATBOT_REMOTE = 'http://localhost:8080/chatbot/chatbot.js';

export default async function decorate(block) {
  const { default: decorateRemote } = await import(CHATBOT_REMOTE);
  await decorateRemote(block);
}
