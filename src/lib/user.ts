const USER_ID_KEY = 'syncmeet_user_id';

export function getOrCreateUserId(): string {
  try {
    let userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem(USER_ID_KEY, userId);
    }
    return userId;
  } catch (e) {
    console.error('Failed accessing localStorage for user ID:', e);
    return crypto.randomUUID();
  }
}
