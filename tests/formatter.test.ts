import { describe, it, expect } from 'vitest';
import { formatTodayList, formatList, formatWeekMarkdown, formatJSON } from '../src/formatter';
import { DevlogEntry } from '../src/types';

const makeEntry = (ts: string, msg: string, tag = 'devlog', id = '1'): DevlogEntry => ({
  id,
  timestamp: ts,
  message: msg,
  tag,
});

describe('formatter', () => {
  describe('formatTodayList', () => {
    it('formats entries as time + tag + message', () => {
      const entries = [makeEntry('2026-06-29T14:30:00.000Z', 'Fixed auth bug', 'devlog')];
      const result = formatTodayList(entries);
      expect(result).toContain('14:30');
      expect(result).toContain('[devlog]');
      expect(result).toContain('Fixed auth bug');
    });

    it('returns empty string for no entries', () => {
      expect(formatTodayList([])).toBe('');
    });
  });

  describe('formatList', () => {
    it('formats entries as date + time + tag + message', () => {
      const entries = [makeEntry('2026-06-29T14:30:00.000Z', 'Fixed auth bug', 'devlog')];
      const result = formatList(entries);
      expect(result).toContain('2026-06-29');
      expect(result).toContain('14:30');
      expect(result).toContain('[devlog]');
      expect(result).toContain('Fixed auth bug');
    });

    it('returns empty string for no entries', () => {
      expect(formatList([])).toBe('');
    });
  });

  describe('formatWeekMarkdown', () => {
    it('groups entries by date chronologically', () => {
      const entries = [
        makeEntry('2026-06-28T10:00:00.000Z', 'Saturday entry', 'devlog'),
        makeEntry('2026-06-29T14:30:00.000Z', 'Sunday entry', 'devlog'),
      ];
      const result = formatWeekMarkdown(entries);
      expect(result).toContain('## Saturday');
      expect(result).toContain('## Sunday');
      expect(result.indexOf('Saturday')).toBeLessThan(result.indexOf('Sunday'));
    });

    it('sorts entries oldest-first within each day', () => {
      const entries = [
        makeEntry('2026-06-29T14:30:00.000Z', 'Second', 'devlog'),
        makeEntry('2026-06-29T09:00:00.000Z', 'First', 'devlog'),
      ];
      const result = formatWeekMarkdown(entries);
      const firstIdx = result.indexOf('First');
      const secondIdx = result.indexOf('Second');
      expect(firstIdx).toBeLessThan(secondIdx);
    });

    it('returns empty string for no entries', () => {
      expect(formatWeekMarkdown([])).toBe('');
    });

    it('includes day range in title', () => {
      const entries = [makeEntry('2026-06-29T14:30:00.000Z', 'Entry', 'devlog')];
      const result = formatWeekMarkdown(entries);
      expect(result).toMatch(/# Devlog: .+ – .+, 2026/);
    });
  });

  describe('formatJSON', () => {
    it('returns compact JSON array', () => {
      const entries = [makeEntry('2026-06-29T14:30:00.000Z', 'Entry', 'devlog')];
      const result = formatJSON(entries);
      expect(result).toBe(JSON.stringify(entries));
    });

    it('returns "[]" for empty array', () => {
      expect(formatJSON([])).toBe('[]');
    });
  });
});
