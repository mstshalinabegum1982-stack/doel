/**
 * Admin Configuration & Permission Checker
 * 
 * Admin emails are read dynamically from the environment variable (VITE_ADMIN_EMAILS)
 * or through database-assigned roles (role: 'admin' / isAdmin: true).
 * No private email addresses are hardcoded in the application source code.
 */

export const getAdminEmails = (): string[] => {
  const metaEnv = (import.meta as any)?.env?.VITE_ADMIN_EMAILS;
  const envEmails = (typeof metaEnv === 'string' ? metaEnv : '').trim();
  if (!envEmails) return [];
  return envEmails
    .split(',')
    .map((email: string) => email.trim().toLowerCase())
    .filter(Boolean);
};

export const checkIsAdmin = (
  user?: { email?: string | null } | null,
  profile?: { isAdmin?: boolean; role?: string; email?: string } | null
): boolean => {
  if (!user && !profile) return false;

  // 1. Check explicit profile role / flag in Firestore database
  if (profile?.isAdmin === true || profile?.role === 'admin') {
    return true;
  }

  // 2. Check if email matches configured admin emails in environment
  const adminEmails = getAdminEmails();
  if (adminEmails.length > 0) {
    const userEmail = (user?.email || '').trim().toLowerCase();
    const profileEmail = (profile?.email || '').trim().toLowerCase();

    if (userEmail && adminEmails.includes(userEmail)) {
      return true;
    }
    if (profileEmail && adminEmails.includes(profileEmail)) {
      return true;
    }
  }

  return false;
};
