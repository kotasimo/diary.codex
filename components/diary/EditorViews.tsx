"use client";

import { useRef, useState, type PointerEvent } from "react";
import { X } from "lucide-react";
import { ProfileAvatar } from "@/components/diary/AppChrome";
import type { Entry, Profile } from "@/types/diary";
import { formatDate, parseDateValue } from "@/utils/date";

type CropSource = { kind: "avatar" | "header"; source: string };

async function resizeImage(file: File, maxWidth: number, maxHeight: number) {
  if (file.size > 10 * 1024 * 1024)
    throw new Error("画像は10MB以下のものを選んでください。");
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(
        new Error("画像を読み込めませんでした。別の画像をお試しください。"),
      );
    reader.onload = () => {
      const image = new Image();
      image.onerror = () =>
        reject(new Error("この画像形式には対応していません。"));
      image.onload = () => {
        const scale = Math.min(
          1,
          maxWidth / image.naturalWidth,
          maxHeight / image.naturalHeight,
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(
            new Error("画像を処理できませんでした。別の画像をお試しください。"),
          );
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/webp", 0.84));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function ImageCropModal({
  source,
  aspect,
  outputWidth,
  onCancel,
  onUse,
}: {
  source: string;
  aspect: number;
  outputWidth: number;
  onCancel: () => void;
  onUse: (image: string) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [cropError, setCropError] = useState("");
  const dragStart = useRef<{
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const frameWidth = 1000;
  const frameHeight = frameWidth / aspect;
  const finishCrop = () => {
    if (!imageSize.width || !imageSize.height) return;
    const baseScale = Math.max(
      frameWidth / imageSize.width,
      frameHeight / imageSize.height,
    );
    const renderedScale = baseScale * zoom;
    const cropWidth = Math.min(imageSize.width, frameWidth / renderedScale);
    const cropHeight = Math.min(imageSize.height, frameHeight / renderedScale);
    const cropX = Math.max(
      0,
      Math.min(
        imageSize.width - cropWidth,
        (imageSize.width - cropWidth) / 2 - offset.x / renderedScale,
      ),
    );
    const cropY = Math.max(
      0,
      Math.min(
        imageSize.height - cropHeight,
        (imageSize.height - cropHeight) / 2 - offset.y / renderedScale,
      ),
    );
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = Math.max(1, Math.round(outputWidth / aspect));
    const context = canvas.getContext("2d");
    if (!context) return;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        context.drawImage(
          image,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        onUse(canvas.toDataURL("image/webp", 0.86));
      } catch {
        setCropError(
          "この画像は切り取れませんでした。画像を選び直してください。",
        );
      }
    };
    image.src = source;
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const limitX = frameWidth * Math.max(0.12, (zoom - 1) / 2 + 0.12);
    const limitY = frameHeight * Math.max(0.12, (zoom - 1) / 2 + 0.12);
    setOffset({
      x: Math.max(
        -limitX,
        Math.min(
          limitX,
          dragStart.current.offsetX + event.clientX - dragStart.current.x,
        ),
      ),
      y: Math.max(
        -limitY,
        Math.min(
          limitY,
          dragStart.current.offsetY + event.clientY - dragStart.current.y,
        ),
      ),
    });
  };
  return (
    <div className="crop-modal-backdrop" role="presentation">
      <section
        className="crop-modal"
        role="dialog"
        aria-modal="true"
        aria-label="画像の表示範囲を調整"
      >
        <header className="crop-modal-header">
          <div>
            <strong>画像の表示範囲</strong>
            <span>画像をドラッグして位置を調整できます</span>
          </div>
          <button
            type="button"
            className="crop-modal-close"
            onClick={onCancel}
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </header>
        <div
          className="crop-frame"
          style={{ aspectRatio: `${aspect}` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => {
            dragStart.current = null;
          }}
          onPointerCancel={() => {
            dragStart.current = null;
          }}
          onPointerLeave={() => {
            dragStart.current = null;
          }}
        >
          <img
            src={source}
            crossOrigin="anonymous"
            alt="切り取り範囲のプレビュー"
            onLoad={(event) =>
              setImageSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
            }
            style={{
              transform: `translate(${offset.x / zoom}px, ${offset.y / zoom}px) scale(${zoom})`,
            }}
          />
          <div className="crop-grid" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
        {cropError && (
          <p className="crop-error" role="alert">
            {cropError}
          </p>
        )}
        <div className="crop-controls">
          <span aria-hidden="true">−</span>
          <input
            aria-label="画像の拡大率"
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
          <span aria-hidden="true">＋</span>
        </div>
        <footer className="crop-modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            キャンセル
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={!imageSize.width}
            onClick={finishCrop}
          >
            この範囲を使う
          </button>
        </footer>
      </section>
    </div>
  );
}

export function ComposeView({
  entry,
  date,
  day,
  onCancel,
  onSave,
}: {
  entry?: Entry;
  date: string;
  day: string;
  onCancel: () => void;
  onSave: (entry: Entry) => Promise<boolean>;
}) {
  const [content, setContent] = useState(entry?.content ?? "");
  const [image, setImage] = useState(entry?.image ?? "");
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const saveEntry = async () => {
    const now = new Date();
    setSaving(true);
    setSaveError("");
    const saved = await onSave({
      date,
      day,
      content: content.trim(),
      updatedAt: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      views: entry?.views ?? 0,
      image: image.trim() || undefined,
    });
    setSaving(false);
    if (!saved)
      setSaveError(
        "保存できませんでした。Supabaseの設定とテーブルを確認してください。",
      );
  };
  const selectImage = async (file: File | undefined) => {
    if (!file) return;
    try {
      setCropSource(await resizeImage(file, 1800, 1200));
      setSaveError("");
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "画像を処理できませんでした。",
      );
    }
  };
  return (
    <>
      <section className="content-panel compose-panel">
        <div className="compose-heading">
          <button className="back-button" onClick={onCancel}>
            <X size={18} />
            キャンセル
          </button>
        </div>
        <div className="compose-title-row">
          <span className="compose-entry-date">
            {formatDate(parseDateValue(date))
              .replace("月", "/")
              .replace("日", "")}
            （{day}）
          </span>
          <button
            type="button"
            className="entry-edit-button compose-save-button"
            disabled={!content.trim() || saving}
            onClick={() => void saveEntry()}
          >
            {saving ? "保存中…" : entry ? "保存" : "公開"}
          </button>
        </div>
        <label className="field-label" htmlFor="body">
          本文
        </label>
        <textarea
          id="body"
          className="body-input"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="今日あったこと、感じたことを書いてみましょう。"
        />
        <div className="compose-image-actions">
          <label className="image-upload-button" htmlFor="image-file">
            画像を追加
          </label>
          <input
            id="image-file"
            type="file"
            accept="image/*"
            onChange={(event) => void selectImage(event.target.files?.[0])}
          />
          {image && (
            <button
              type="button"
              className="image-adjust-button"
              onClick={() => setCropSource(image)}
            >
              画像の表示範囲を調整
            </button>
          )}
        </div>
        {saveError && (
          <p className="compose-save-error" role="alert">
            {saveError}
          </p>
        )}
      </section>
      {cropSource && (
        <ImageCropModal
          source={cropSource}
          aspect={1}
          outputWidth={800}
          onCancel={() => setCropSource(null)}
          onUse={(croppedImage) => {
            setImage(croppedImage);
            setCropSource(null);
          }}
        />
      )}
    </>
  );
}

export function ProfileSettingsView({
  profile,
  onCancel,
  onSave,
}: {
  profile: Profile;
  onCancel: () => void;
  onSave: (profile: Profile) => void;
}) {
  const [draft, setDraft] = useState(profile);
  const [imageError, setImageError] = useState("");
  const [cropSource, setCropSource] = useState<CropSource | null>(null);
  const selectImage = async (
    file: File | undefined,
    kind: CropSource["kind"],
  ) => {
    if (!file) return;
    setImageError("");
    try {
      setCropSource({
        kind,
        source: await resizeImage(
          file,
          kind === "avatar" ? 1800 : 2400,
          kind === "avatar" ? 1800 : 1400,
        ),
      });
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "画像を処理できませんでした。",
      );
    }
  };
  const canSave =
    draft.displayName.trim() &&
    draft.diaryTitle.trim() &&
    draft.subtitle.trim() &&
    draft.bio.trim();
  return (
    <>
      <section className="content-panel profile-settings-panel">
        <header className="profile-settings-heading">
          <div>
            <p className="eyebrow">PROFILE</p>
            <h1>プロフィール設定</h1>
            <p>日記に表示される名前や紹介文を編集できます。</p>
          </div>
        </header>
        <div className="profile-settings-body">
          <section
            className="profile-preview"
            aria-label="プロフィールのプレビュー"
          >
            <ProfileAvatar profile={draft} large />
            <div>
              <strong>{draft.displayName.trim() || "表示名"}</strong>
              <span>{draft.bio.trim() || "紹介文がここに表示されます。"}</span>
            </div>
          </section>
          <div className="profile-avatar-actions">
            <label className="secondary-button" htmlFor="profile-avatar-file">
              画像を選ぶ
            </label>
            <input
              id="profile-avatar-file"
              type="file"
              accept="image/*"
              onChange={(event) =>
                void selectImage(event.target.files?.[0], "avatar")
              }
            />
            {draft.avatar && (
              <button
                type="button"
                className="profile-image-remove"
                onClick={() =>
                  setDraft((current) => ({ ...current, avatar: undefined }))
                }
              >
                画像を削除
              </button>
            )}
            {draft.avatar && (
              <button
                type="button"
                className="image-adjust-button"
                onClick={() =>
                  setCropSource({ kind: "avatar", source: draft.avatar! })
                }
              >
                表示範囲を調整
              </button>
            )}
            <span className="profile-image-hint">10MBまで・自動で縮小</span>
          </div>
          {imageError && (
            <p className="profile-form-error" role="alert">
              {imageError}
            </p>
          )}
          <section className="profile-header-setting">
            <div className="profile-setting-label">
              <strong>ヘッダー画像</strong>
              <span>日記上部に表示される画像です</span>
            </div>
            <div
              className="profile-header-preview"
              style={
                draft.headerImage
                  ? {
                      backgroundImage: `linear-gradient(180deg, rgba(38, 66, 78, .08), rgba(38, 66, 78, .36)), url(${draft.headerImage})`,
                    }
                  : undefined
              }
            >
              <strong>{draft.diaryTitle.trim() || "日記タイトル"}</strong>
              <span>{draft.subtitle.trim() || "日記のサブタイトル"}</span>
            </div>
            <div className="profile-header-actions">
              <label className="secondary-button" htmlFor="profile-header-file">
                画像を選ぶ
              </label>
              <input
                id="profile-header-file"
                type="file"
                accept="image/*"
                onChange={(event) =>
                  void selectImage(event.target.files?.[0], "header")
                }
              />
              {draft.headerImage && (
                <button
                  type="button"
                  className="profile-image-remove"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      headerImage: undefined,
                    }))
                  }
                >
                  標準画像に戻す
                </button>
              )}
              {draft.headerImage && (
                <button
                  type="button"
                  className="image-adjust-button"
                  onClick={() =>
                    setCropSource({
                      kind: "header",
                      source: draft.headerImage!,
                    })
                  }
                >
                  表示範囲を調整
                </button>
              )}
              <span className="profile-image-hint">10MBまで・自動で縮小</span>
            </div>
          </section>
          <div className="profile-form-grid">
            <label>
              <span>表示名</span>
              <input
                value={draft.displayName}
                maxLength={24}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    displayName: event.target.value,
                  }))
                }
              />
              <small>{draft.displayName.length} / 24</small>
            </label>
            <label>
              <span>日記タイトル</span>
              <input
                value={draft.diaryTitle}
                maxLength={60}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    diaryTitle: event.target.value,
                  }))
                }
              />
              <small>{draft.diaryTitle.length} / 60</small>
            </label>
            <label>
              <span>日記のサブタイトル</span>
              <input
                value={draft.subtitle}
                maxLength={80}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    subtitle: event.target.value,
                  }))
                }
              />
              <small>{draft.subtitle.length} / 80</small>
            </label>
            <label className="profile-bio-field">
              <span>自己紹介文</span>
              <textarea
                value={draft.bio}
                maxLength={120}
                rows={4}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    bio: event.target.value,
                  }))
                }
              />
              <small>{draft.bio.length} / 120</small>
            </label>
          </div>
        </div>
        <div className="profile-settings-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            キャンセル
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={!canSave}
            onClick={() =>
              onSave({
                ...draft,
                displayName: draft.displayName.trim(),
                diaryTitle: draft.diaryTitle.trim(),
                subtitle: draft.subtitle.trim(),
                bio: draft.bio.trim(),
              })
            }
          >
            保存する
          </button>
        </div>
      </section>
      {cropSource && (
        <ImageCropModal
          source={cropSource.source}
          aspect={cropSource.kind === "header" ? 5 : 1}
          outputWidth={cropSource.kind === "header" ? 1600 : 512}
          onCancel={() => setCropSource(null)}
          onUse={(image) => {
            setDraft((current) =>
              cropSource.kind === "avatar"
                ? { ...current, avatar: image }
                : { ...current, headerImage: image },
            );
            setCropSource(null);
          }}
        />
      )}
    </>
  );
}
