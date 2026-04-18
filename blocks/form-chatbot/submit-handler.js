import { generateUniqueId } from '../form/functions.js';

function resolveSubmitId(referenceId) {
  return referenceId
    || new URLSearchParams(window.location.search).get('id')
    || generateUniqueId();
}

function buildSuccessMessage(uniqueId) {
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = 'AI';

  const refId = document.createElement('strong');
  refId.textContent = uniqueId;

  const ref = document.createElement('p');
  ref.append('Application Reference Number ', refId);

  const heading = document.createElement('p');
  heading.append(Object.assign(document.createElement('strong'), { textContent: 'Application Submitted Successfully!' }));

  const footer = document.createElement('p');
  footer.textContent = 'You will receive your physical Credit Card within 7 working days.';

  const content = document.createElement('div');
  content.className = 'message-content';
  content.append(heading, ref, footer);

  const msg = document.createElement('div');
  msg.className = 'message bot success';
  msg.append(avatar, content);
  return msg;
}

export function registerSubmitHandler() {
  document.addEventListener('chatbot:before-submit', (e) => {
    e.preventDefault();

    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const uniqueId = resolveSubmitId();
    const msg = buildSuccessMessage(uniqueId);

    const lastBot = [...chatMessages.querySelectorAll('.message.bot')].pop();
    if (lastBot) lastBot.replaceWith(msg);
    else chatMessages.append(msg);

    chatMessages.scrollTop = chatMessages.scrollHeight;

    const card = window.myForm?.exportData()?.card?.title || 'Gold';
    setTimeout(() => {
      window.location.href = `/thankyou?id=${uniqueId}&card=${encodeURIComponent(card)}`;
    }, 3000);
  });
}
