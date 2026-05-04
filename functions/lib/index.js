"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearOwnMustChangePassword = exports.deleteAdminUser = exports.resetAdminPassword = exports.updateAdminUser = exports.createAdminUser = exports.listAdminUsers = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
admin.initializeApp();
const OWNER_EMAILS = (0, params_1.defineString)('OWNER_EMAILS', {
    description: 'Comma separated owner emails that can manage users.'
});
function parseOwnerEmails() {
    return new Set(OWNER_EMAILS.value()
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean));
}
function assertOwner(context) {
    const email = context.auth?.token?.email?.toLowerCase();
    if (!email) {
        throw new https_1.HttpsError('unauthenticated', 'Sign in required.');
    }
    if (!parseOwnerEmails().has(email)) {
        throw new https_1.HttpsError('permission-denied', 'Owner access required.');
    }
}
function normalizeRole(raw) {
    if (raw === 'Owner' || raw === 'Editor' || raw === 'Admin') {
        return raw;
    }
    return 'Editor';
}
exports.listAdminUsers = (0, https_1.onCall)(async (request) => {
    assertOwner(request);
    const pages = await admin.auth().listUsers(1000);
    const users = await Promise.all(pages.users.map(async (user) => {
        const claims = (user.customClaims ?? {});
        return {
            uid: user.uid,
            email: user.email ?? '',
            displayName: user.displayName ?? '',
            role: normalizeRole(claims.role),
            mustChangePassword: claims.mustChangePassword === true
        };
    }));
    return { users: users.filter((user) => user.email !== '') };
});
exports.createAdminUser = (0, https_1.onCall)(async (request) => {
    assertOwner(request);
    const data = request.data;
    const email = typeof data.email === 'string' ? data.email.trim() : '';
    const displayName = typeof data.displayName === 'string' ? data.displayName.trim() : '';
    const temporaryPassword = typeof data.temporaryPassword === 'string' ? data.temporaryPassword.trim() : '';
    if (!email || !displayName || temporaryPassword.length < 8) {
        throw new https_1.HttpsError('invalid-argument', 'Email, displayName, and temporaryPassword are required.');
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
exports.updateAdminUser = (0, https_1.onCall)(async (request) => {
    assertOwner(request);
    const data = request.data;
    const uid = typeof data.uid === 'string' ? data.uid.trim() : '';
    const displayName = typeof data.displayName === 'string' ? data.displayName.trim() : '';
    if (!uid || !displayName) {
        throw new https_1.HttpsError('invalid-argument', 'uid and displayName are required.');
    }
    await admin.auth().updateUser(uid, { displayName });
    const user = await admin.auth().getUser(uid);
    const existingClaims = (user.customClaims ?? {});
    await admin.auth().setCustomUserClaims(uid, {
        ...existingClaims,
        role: normalizeRole(data.role)
    });
    return { ok: true };
});
exports.resetAdminPassword = (0, https_1.onCall)(async (request) => {
    assertOwner(request);
    const data = request.data;
    const uid = typeof data.uid === 'string' ? data.uid.trim() : '';
    const temporaryPassword = typeof data.temporaryPassword === 'string' ? data.temporaryPassword.trim() : '';
    if (!uid || temporaryPassword.length < 8) {
        throw new https_1.HttpsError('invalid-argument', 'uid and temporaryPassword (8+) are required.');
    }
    await admin.auth().updateUser(uid, { password: temporaryPassword });
    const user = await admin.auth().getUser(uid);
    const existingClaims = (user.customClaims ?? {});
    await admin.auth().setCustomUserClaims(uid, {
        ...existingClaims,
        mustChangePassword: true
    });
    return { ok: true };
});
exports.deleteAdminUser = (0, https_1.onCall)(async (request) => {
    assertOwner(request);
    const data = request.data;
    const uid = typeof data.uid === 'string' ? data.uid.trim() : '';
    if (!uid) {
        throw new https_1.HttpsError('invalid-argument', 'uid is required.');
    }
    await admin.auth().deleteUser(uid);
    return { ok: true };
});
exports.clearOwnMustChangePassword = (0, https_1.onCall)(async (request) => {
    if (!request.auth?.uid) {
        throw new https_1.HttpsError('unauthenticated', 'Sign in required.');
    }
    const user = await admin.auth().getUser(request.auth.uid);
    const existingClaims = (user.customClaims ?? {});
    await admin.auth().setCustomUserClaims(request.auth.uid, {
        ...existingClaims,
        mustChangePassword: false
    });
    return { ok: true };
});
