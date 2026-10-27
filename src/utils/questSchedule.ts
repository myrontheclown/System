import { PlayerProfile, Quest } from '../types';

export const DEFAULT_DAILY_RESET_TIME = '04:00 AM';

export interface QuestScheduleState {
  lastQuestDayKey?: string;
  lastProcessedResetDayKey?: string;
  processedMissedDayKeys?: string[];
}

export function parseResetTime(resetTime: string): { hour: number; minute: number } {
  if (!resetTime || typeof resetTime !== 'string') {
    return { hour: 4, minute: 0 };
  }
  const match = resetTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) {
    return { hour: 4, minute: 0 };
  }
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && hour !== 12) {
    hour += 12;
  }
  if (meridiem === 'AM' && hour === 12) {
    hour = 0;
  }
  return { hour, minute };
}

export function getQuestDayKey(date: Date, resetTime: string): string {
  const reset = resetTime || DEFAULT_DAILY_RESET_TIME;
  const { hour, minute } = parseResetTime(reset);
  const local = new Date(date.getTime());
  if (local.getHours() < hour || (local.getHours() === hour && local.getMinutes() < minute)) {
    local.setDate(local.getDate() - 1);
  }
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, '0');
  const d = String(local.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d + '|' + reset;
}

export function isNewQuestDay(lastKey: string | undefined, now: Date, resetTime: string): boolean {
  if (!lastKey) return true;
  const currentKey = getQuestDayKey(now, resetTime || DEFAULT_DAILY_RESET_TIME);
  return currentKey !== lastKey;
}

export function getEffectiveResetTime(preferences?: PlayerProfile['preferences']): string {
  if (!preferences || !preferences.dailyResetTime) {
    return DEFAULT_DAILY_RESET_TIME;
  }
  return preferences.dailyResetTime;
}
