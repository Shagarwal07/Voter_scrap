export interface SuperUserResult {
  isDeveloper: boolean;
  isAdmin: boolean;
  isSuperUser: boolean;
}

/**
 * SuperUser verification helper.
 * - On the server: verifies role or fallback against DEVELOPER_EMAIL / ADMIN_EMAIL (never exposed to client).
 * - On the client: process.env.DEVELOPER_EMAIL is undefined, so it safely evaluates based on session role.
 * Supports passing a session/token user object, or role and email strings directly.
 */
export function checkSuperUser(
  userOrRole?: { role?: string | null; email?: string | null } | string | null,
  rawEmail?: string | null
): SuperUserResult {
  let role: string | null = null;
  let email: string | null = null;

  if (typeof userOrRole === 'object' && userOrRole !== null) {
    role = userOrRole.role || null;
    email = userOrRole.email || null;
  } else {
    role = userOrRole || null;
    email = rawEmail || null;
  }

  const userEmail = (email || '').trim().toLowerCase();
  const devEmail = (process.env.DEVELOPER_EMAIL || '').trim().toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

  const isDeveloper =
    role === 'developer' ||
    (devEmail !== '' && userEmail === devEmail);
  const isAdmin =
    role === 'admin' ||
    (adminEmail !== '' && userEmail === adminEmail);

  return {
    isDeveloper,
    isAdmin,
    isSuperUser: isDeveloper || isAdmin,
  };
}
