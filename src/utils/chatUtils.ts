import { UserProfile, Message } from '../types';
import { parseCallLog } from '../lib/utils';

/**
 * Generates a clean, user-friendly reply preview string from a message object,
 * preventing raw tokens, base64 audio, raw call logs, or JSON strings from showing.
 */
export function getCleanReplyPreview(message: Message | null | undefined, currentUserId?: string): string {
  if (!message) return '';

  // 1. Call Log
  if (message.type === 'call' || (typeof message.text === 'string' && (message.text.startsWith('CALL_LOG:') || message.text.startsWith('VIDEO_CALL_LOG:') || message.text.startsWith('AUDIO_CALL_LOG:')))) {
    const parsed = parseCallLog(message.text || '', currentUserId || '');
    if (parsed) {
      return parsed.text;
    }
    const isVideo = (message.text || '').includes('VIDEO');
    return isVideo ? '📹 Video Call' : '📞 Audio Call';
  }

  // 2. Voice Message
  if (message.type === 'voice' || message.voiceUrl || (typeof message.text === 'string' && message.text.includes('Voice Message'))) {
    const dur = message.voiceDuration || 0;
    if (dur > 0) {
      const m = Math.floor(dur / 60);
      const s = Math.floor(dur % 60);
      return `🎤 Voice Message (${m}:${s < 10 ? '0' : ''}${s})`;
    }
    return '🎤 Voice Message';
  }

  // 3. Order Message
  if (message.type === 'order' || (message as any).orderData || message.orderId) {
    const order = (message as any).orderData || (message as any).order;
    if (order?.productName) {
      const price = order.sellPrice || order.totalPrice || order.price;
      return `📦 Order: ${order.productName}${price ? ` (৳${price})` : ''}`;
    }
    if (message.text && !message.text.startsWith('{') && !message.text.startsWith('ORD-') && message.text.length < 50) {
      return `📦 Order: ${message.text}`;
    }
    return '📦 Order Card';
  }

  // 4. Payment Request
  if (message.type === 'payment_request' || (message as any).paymentData) {
    const amount = (message as any).paymentData?.amount;
    return `💰 Payment Request${amount ? `: ৳${amount}` : ''}`;
  }

  // 5. Image / Media Message
  if (message.type === 'image' || (message as any).imageUrl) {
    return '📷 Photo';
  }

  // 6. Deleted Message
  if (message.type === 'deleted') {
    return '🗑️ Deleted message';
  }

  // 7. Standard Text Message (Strip any raw JSON, token prefixes, data URLs, etc.)
  const rawText = (message.text || '').trim();
  if (rawText.startsWith('data:audio/') || rawText.startsWith('data:image/')) {
    return rawText.startsWith('data:audio/') ? '🎤 Voice Message' : '📷 Photo';
  }
  if (rawText.startsWith('{') && rawText.endsWith('}')) {
    try {
      const parsedObj = JSON.parse(rawText);
      if (parsedObj.productName) return `📦 Order: ${parsedObj.productName}`;
      if (parsedObj.text) return parsedObj.text;
    } catch (_) {}
    return 'Message';
  }

  return rawText.length > 80 ? rawText.substring(0, 77) + '...' : rawText;
}

/**
 * Resolves activeChatId and otherId from a raw chatId parameter and current user's UID.
 */
export function resolveChatId(chatId: string | undefined, currentUid: string | undefined): {
  activeChatId: string;
  otherId: string;
} {
  if (!chatId || !currentUid) {
    return { activeChatId: '', otherId: '' };
  }
  if (chatId.startsWith('new_')) {
    const otherId = chatId.replace('new_', '');
    const activeChatId = [currentUid, otherId].sort().join('_');
    return { activeChatId, otherId };
  }
  const parts = chatId.split('_');
  const otherId = parts.find(id => id !== currentUid) || '';
  return { activeChatId: chatId, otherId };
}

/**
 * Calculates formatting and status text for user presence (online/offline/last active).
 */
export function getPresenceStatus(otherUser: UserProfile | null | undefined, now: Date = new Date()) {
  if (!otherUser) return { isOnline: false, text: 'Offline' };

  const thresholdMs = 240 * 1000; // 4 minutes

  if (!otherUser.lastActive) {
    return { isOnline: false, text: 'Offline' };
  }

  const lastActiveTime = new Date(otherUser.lastActive).getTime();
  const currentTime = now.getTime();
  const diffMs = currentTime - lastActiveTime;

  if (diffMs < thresholdMs) {
    return { isOnline: true, text: 'ONLINE' };
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  let relativeText = '';
  if (diffMin < 1) {
    relativeText = 'just now';
  } else if (diffMin === 1) {
    relativeText = '1 minute ago';
  } else if (diffMin < 60) {
    relativeText = `${diffMin} minutes ago`;
  } else if (diffHr === 1) {
    relativeText = '1 hour ago';
  } else if (diffHr < 24) {
    relativeText = `${diffHr} hours ago`;
  } else if (diffDay === 1) {
    relativeText = '1 day ago';
  } else {
    relativeText = `${diffDay} days ago`;
  }

  return { isOnline: false, text: `Last active ${relativeText}` };
}
