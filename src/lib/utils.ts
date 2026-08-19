import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | number | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

export function parseCallLog(logStr: string, currentUserId: string) {
  if (!logStr) return null;
  const isVideo = logStr.startsWith('VIDEO_CALL_LOG:');
  const isAudio = logStr.startsWith('CALL_LOG:');
  if (!isVideo && !isAudio) return null;

  const parts = logStr.split(':');
  if (parts.length < 5) return null;
  const [_, callerId, receiverId, status, durationSecsStr] = parts;
  const durationSecs = parseInt(durationSecsStr, 10) || 0;
  
  const isCaller = currentUserId === callerId;
  const icon = isVideo ? '📹' : '📞';
  const label = isVideo ? 'Video Call' : 'Audio Call';
  
  if (status === 'connected') {
    const mins = Math.floor(durationSecs / 60);
    const secs = durationSecs % 60;
    
    let durationText = '';
    if (mins > 0) {
      durationText += `${mins} min `;
    }
    durationText += `${secs} sec`;
    
    return {
      type: 'connected',
      text: `${icon} ${label} (${durationText})`,
      durationSecs,
      isVideo
    };
  } else {
    if (isCaller) {
      return {
        type: 'missed_sent',
        text: `${icon} ${label}`,
        durationSecs: 0,
        isVideo
      };
    } else {
      return {
        type: 'missed_received',
        text: `${icon} Missed ${label}`,
        durationSecs: 0,
        isVideo
      };
    }
  }
}
