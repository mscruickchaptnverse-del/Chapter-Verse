import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineString } from 'firebase-functions/params';

admin.initializeApp();

type ManagedRole = 'Owner' | 'Editor' | 'Admin';

const OWNER_EMAILS = defineString('OWNER_EMAILS', {
  description: 'Comma separated owner emails that can manage users.'
});

function parseOwnerEmails(): Set<string> {
  return new Set(
    OWNER_EMAILS.value()
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
}

function assertOwner(context: { auth?: { token?: { email?: string } } }): void {
  const email = context.auth?.token?.email?.toLowerCase();
  if (!email) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }
  if (!parseOwnerEmails().has(email)) {
    throw new HttpsError('permission-denied', 'Owner access required.');
  }
}

function normalizeRole(raw: unknown): ManagedRole {
  if (raw === 'Owner' || raw === 'Editor' || raw === 'Admin') {
    return raw;
  }
  return 'Editor';
}

export const listAdminUsers = onCall(async (request) => {
  assertOwner(request);
  const pages = await admin.auth().listUsers(1000);
  const users = await Promise.all(
    pages.users.map(async (user) => {
      const claims = (user.customClaims ?? {}) as { role?: ManagedRole; mustChangePassword?: boolean };
      return {
        uid: user.uid,
        email: user.email ?? '',
        displayName: user.displayName ?? '',
        role: normalizeRole(claims.role),
        mustChangePassword: claims.mustChangePassword === true
      };
    })
  );
  return { users: users.filter((user) => user.email !== '') };
});

export const createAdminUser = onCall(async (request) => {
  assertOwner(request);
  const data = request.data as {
    email?: unknown;
    displayName?: unknown;
    role?: unknown;
    temporaryPassword?: unknown;
  };
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  const displayName = typeof data.displayName === 'string' ? data.displayName.trim() : '';
  const temporaryPassword = typeof data.temporaryPassword === 'string' ? data.temporaryPassword.trim() : '';
  if (!email || !displayName || temporaryPassword.length < 8) {
    throw new HttpsError('invalid-argument', 'Email, displayName, and temporaryPassword are required.');
  }

  const role = normalizeRole(data.role);
  const created = await admin.auth().createUser({
    email,
    displayName,
    password: temporaryPassword,
    emailVerified: true
  });
  await admin.auth().setCustomUserClaims(created.uid, {
    role,
    mustChangePassword: true
  });

  return {
    user: {
      uid: created.uid,
      email,
      displayName,
      role,
      mustChangePassword: true
    }
  };
});

export const updateAdminUser = onCall(async (request) => {
  assertOwner(request);
  const data = request.data as { uid?: unknown; displayName?: unknown; role?: unknown };
  const uid = typeof data.uid === 'string' ? data.uid.trim() : '';
  const displayName = typeof data.displayName === 'string' ? data.displayName.trim() : '';
  if (!uid || !displayName) {
    throw new HttpsError('invalid-argument', 'uid and displayName are required.');
  }
  await admin.auth().updateUser(uid, { displayName });

  const user = await admin.auth().getUser(uid);
  const existingClaims = (user.customClaims ?? {}) as Record<string, unknown>;
  await admin.auth().setCustomUserClaims(uid, {
    ...existingClaims,
    role: normalizeRole(data.role)
  });
  return { ok: true };
});

export const resetAdminPassword = onCall(async (request) => {
  assertOwner(request);
  const data = request.data as { uid?: unknown; temporaryPassword?: unknown };
  const uid = typeof data.uid === 'string' ? data.uid.trim() : '';
  const temporaryPassword = typeof data.temporaryPassword === 'string' ? data.temporaryPassword.trim() : '';
  if (!uid || temporaryPassword.length < 8) {
    throw new HttpsError('invalid-argument', 'uid and temporaryPassword (8+) are required.');
  }
  await admin.auth().updateUser(uid, { password: temporaryPassword });
  const user = await admin.auth().getUser(uid);
  const existingClaims = (user.customClaims ?? {}) as Record<string, unknown>;
  await admin.auth().setCustomUserClaims(uid, {
    ...existingClaims,
    mustChangePassword: true
  });
  return { ok: true };
});

export const deleteAdminUser = onCall(async (request) => {
  assertOwner(request);
  const data = request.data as { uid?: unknown };
  const uid = typeof data.uid === 'string' ? data.uid.trim() : '';
  if (!uid) {
    throw new HttpsError('invalid-argument', 'uid is required.');
  }
  await admin.auth().deleteUser(uid);
  return { ok: true };
});

export const clearOwnMustChangePassword = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }
  const user = await admin.auth().getUser(request.auth.uid);
  const existingClaims = (user.customClaims ?? {}) as Record<string, unknown>;
  await admin.auth().setCustomUserClaims(request.auth.uid, {
    ...existingClaims,
    mustChangePassword: false
  });
  return { ok: true };
});
