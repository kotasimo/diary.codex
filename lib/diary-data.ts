import type { Entry, Profile } from "@/types/diary";

export const defaultProfile: Profile = {
  displayName: "kotaro",
  diaryTitle: "kotaroの日記",
  subtitle: "何でもない毎日を、忘れないために。",
  bio: "日々の出来事を、ゆっくり記録しています。",
};

export function upgradeProfile(profile?: Partial<Profile> | null): Profile {
  const source = profile ?? {};
  const isLegacyProfile = source.subtitle === undefined;
  return {
    displayName: source.displayName ?? defaultProfile.displayName,
    diaryTitle: source.diaryTitle ?? defaultProfile.diaryTitle,
    subtitle: source.subtitle ?? source.bio ?? defaultProfile.subtitle,
    bio: isLegacyProfile
      ? defaultProfile.bio
      : (source.bio ?? defaultProfile.bio),
    avatar: source.avatar,
    headerImage: source.headerImage,
  };
}

export const initialEntries: Entry[] = [
  {
    date: "2026-10-05",
    day: "月",
    title: "金木犀の帰り道",
    content:
      "仕事を少し早めに切り上げて、遠回りして帰った。角を曲がったところで金木犀の香りがして、ようやく秋が来た気がした。急がず歩くと、いつもの道にも知らない景色がある。",
    updatedAt: "21:42",
    views: 18,
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=720&q=80",
  },
  {
    date: "2026-10-06",
    day: "火",
    title: "小さく始める",
    content:
      "やりたいことがいくつもあるのに、どれも大きすぎて動けずにいた。でも今日、まずはノートを一冊買った。小さく始めれば、それでいい。",
    updatedAt: "08:16",
    views: 12,
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=720&q=80",
  },
  {
    date: "2026-10-07",
    day: "水",
    title: "雨の音で目が覚めた",
    content:
      "雨の音で目が覚めた。窓を開けると、ひんやりとした空気。何をするでもない朝だったけれど、こういう時間も嫌いじゃない。",
    updatedAt: "23:08",
    views: 24,
    image:
      "https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=720&q=80",
  },
  {
    date: "2026-10-09",
    day: "金",
    title: "読みかけの本",
    content:
      "寝る前に、少しだけ本を読んだ。登場人物の言葉が、妙に沁みた。自分の今の気持ちと、どこか重なっている気がして。",
    updatedAt: "22:14",
    views: 20,
  },
  {
    date: "2026-10-10",
    day: "土",
    title: "静かな土曜日",
    content:
      "予定を入れない土曜日。読みかけの本を開いて、眠くなったら昼寝をした。夕方に散歩へ出たら、空が薄い桃色だった。",
    updatedAt: "18:35",
    views: 31,
  },
  {
    date: "2026-10-11",
    day: "日",
    title: "来週に向けて",
    content:
      "部屋を少し片づけて、やることリストを見直した。完璧じゃなくていい、また一週間、やっていこう。",
    updatedAt: "20:02",
    views: 16,
  },
];
