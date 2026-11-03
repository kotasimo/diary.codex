"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RecordTab } from "@/types/diary";

export function RecordTabs({
  tabs,
  activeId,
  onSelect,
  onAdd,
  onClose,
  onRename,
}: {
  tabs: RecordTab[];
  activeId: string;
  onSelect: (tabId: string) => void;
  onAdd: () => void;
  onClose: (tabId: string) => void;
  onRename: (tabId: string, name: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [menu, setMenu] = useState<{ tabId: string; x: number; y: number }>();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const activeRef = useRef<HTMLDivElement | null>(null);
  const knownIds = useRef(tabs.map((tab) => tab.id));
  const awaitingNewTab = useRef(false);

  useEffect(() => {
    if (editingId) inputRef.current?.select();
  }, [editingId]);

  // Keep the current tab in view once there are more tabs than the bar fits.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  // A tab added from the "+" button opens straight into its name, so it can
  // be named while creating it. Tabs restored from storage are left alone.
  useEffect(() => {
    const added = tabs.find((tab) => !knownIds.current.includes(tab.id));
    knownIds.current = tabs.map((tab) => tab.id);
    if (awaitingNewTab.current && added) {
      awaitingNewTab.current = false;
      setDraft(added.name);
      setEditingId(added.id);
    }
  }, [tabs]);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(undefined);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(undefined);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menu]);

  const startRename = (tab: RecordTab) => {
    setMenu(undefined);
    setDraft(tab.name);
    setEditingId(tab.id);
  };
  const commitRename = () => {
    if (editingId) onRename(editingId, draft);
    setEditingId(null);
  };
  const menuTab = tabs.find((tab) => tab.id === menu?.tabId);

  return (
    <div className="record-tabs">
      <div className="record-tabs-strip">
        <div className="record-tab-list" role="tablist" aria-label="記録のタブ">
          {tabs.map((tab) => (
            <div
              className={`record-tab${tab.id === activeId ? " active" : ""}`}
              key={tab.id}
              ref={tab.id === activeId ? activeRef : undefined}
              onContextMenu={(event) => {
                event.preventDefault();
                setMenu({ tabId: tab.id, x: event.clientX, y: event.clientY });
              }}
            >
              {editingId === tab.id ? (
                <input
                  ref={inputRef}
                  className="record-tab-input"
                  value={draft}
                  aria-label="タブの名前"
                  onChange={(event) => setDraft(event.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") commitRename();
                    if (event.key === "Escape") setEditingId(null);
                  }}
                />
              ) : (
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab.id === activeId}
                  className="record-tab-label"
                  title={`${tab.name}（ダブルクリックまたは右クリックで名前を変更）`}
                  onClick={() => onSelect(tab.id)}
                  onDoubleClick={() => startRename(tab)}
                  onKeyDown={(event) => {
                    if (event.key === "F2") startRename(tab);
                  }}
                >
                  {tab.name}
                </button>
              )}
              {tabs.length > 1 && editingId !== tab.id && (
                <button
                  type="button"
                  className="record-tab-close"
                  aria-label={`${tab.name}を閉じる`}
                  onClick={() => onClose(tab.id)}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="record-tab-add"
          aria-label="タブを追加"
          title="タブを追加"
          onClick={() => {
            awaitingNewTab.current = true;
            onAdd();
          }}
        >
          <Plus size={16} />
        </button>
      </div>
      {menu && menuTab && (
        <div
          className="record-tab-menu"
          style={{ left: menu.x, top: menu.y }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button type="button" onClick={() => startRename(menuTab)}>
            名前を変更
          </button>
          <button
            type="button"
            disabled={tabs.length <= 1}
            onClick={() => {
              setMenu(undefined);
              onClose(menuTab.id);
            }}
          >
            タブを閉じる
          </button>
        </div>
      )}
    </div>
  );
}
