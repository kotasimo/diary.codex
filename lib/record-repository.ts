import type { LifeRecord, RecordTab } from "@/types/diary";

const legacyRecordsKey = "hibi-life-records";
const tabsKey = "hibi-record-tabs";

export const defaultTabId = "default";
export const defaultTabName = "記録";

const recordsKeyOf = (tabId: string) => `${legacyRecordsKey}:${tabId}`;

export type RecordTabsState = { tabs: RecordTab[]; activeId: string };

const initialState = (): RecordTabsState => ({
  tabs: [{ id: defaultTabId, name: defaultTabName }],
  activeId: defaultTabId,
});

function readJson<T>(key: string): T | null {
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : null;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

export function createTabId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function saveRecordTabs(tabs: RecordTab[], activeId: string) {
  window.localStorage.setItem(tabsKey, JSON.stringify({ tabs, activeId }));
}

export function loadRecordTabs(): RecordTabsState {
  if (typeof window === "undefined") return initialState();
  const saved = readJson<RecordTabsState>(tabsKey);
  if (saved?.tabs?.length) {
    return {
      tabs: saved.tabs,
      activeId: saved.tabs.some((tab) => tab.id === saved.activeId)
        ? saved.activeId
        : saved.tabs[0].id,
    };
  }
  // First run with tabs: adopt records written before tabs existed.
  const legacy = readJson<LifeRecord[]>(legacyRecordsKey);
  if (legacy?.length && !window.localStorage.getItem(recordsKeyOf(defaultTabId))) {
    window.localStorage.setItem(recordsKeyOf(defaultTabId), JSON.stringify(legacy));
  }
  const state = initialState();
  saveRecordTabs(state.tabs, state.activeId);
  return state;
}

export function loadLifeRecords(tabId: string = defaultTabId): LifeRecord[] {
  if (typeof window === "undefined") return [];
  return readJson<LifeRecord[]>(recordsKeyOf(tabId)) ?? [];
}

export function saveLifeRecords(tabId: string, records: LifeRecord[]) {
  window.localStorage.setItem(recordsKeyOf(tabId), JSON.stringify(records));
}

export function removeLifeRecords(tabId: string) {
  window.localStorage.removeItem(recordsKeyOf(tabId));
}
