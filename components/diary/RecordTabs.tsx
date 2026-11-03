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
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingId) inputRef.current?.select();
  }, [editingId]);

  const startRename = (tab: RecordTab) => {
    setDraft(tab.name);
    setEditingId(tab.id);
  };
  const commitRename = () => {
    if (editingId) onRename(editingId, draft);
    setEditingId(null);
  };

  return (
    <div className="record-tabs">
      <div className="record-tabs-strip" role="tablist" aria-label="記録のタブ">
        {tabs.map((tab) => (
          <div
            className={`record-tab${tab.id === activeId ? " active" : ""}`}
            key={tab.id}
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
                title={`${tab.name}（ダブルクリックで名前を変更）`}
                onClick={() => onSelect(tab.id)}
                onDoubleClick={() => startRename(tab)}
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
        <button
          type="button"
          className="record-tab-add"
          aria-label="タブを追加"
          title="タブを追加"
          onClick={onAdd}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
