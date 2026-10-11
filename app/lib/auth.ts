export const localAuthEnabled = process.env.NODE_ENV !== "production";
export const localUsersKey = "hibi-local-auth-users";
export const localSessionKey = "hibi-local-auth-session";

export type LocalAuthUser = {
  email: string;
  password: string;
  username: string;
};

export function getLocalUsers(): LocalAuthUser[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(localUsersKey);
    return saved ? JSON.parse(saved) as LocalAuthUser[] : [];
  } catch {
    return [];
  }
}

export function saveLocalUsers(users: LocalAuthUser[]) {
  window.localStorage.setItem(localUsersKey, JSON.stringify(users));
}
