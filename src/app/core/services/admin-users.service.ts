import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export interface ManagedUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'Owner' | 'Editor' | 'Admin';
  mustChangePassword: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminUsersService {
  constructor(private readonly functions: Functions) {}

  async listUsers(): Promise<ManagedUser[]> {
    const call = httpsCallable<unknown, { users: ManagedUser[] }>(this.functions, 'listAdminUsers');
    const result = await call({});
    return result.data.users;
  }

  async createUser(payload: {
    email: string;
    displayName: string;
    role: ManagedUser['role'];
    temporaryPassword: string;
  }): Promise<ManagedUser> {
    const call = httpsCallable<typeof payload, { user: ManagedUser }>(this.functions, 'createAdminUser');
    const result = await call(payload);
    return result.data.user;
  }

  async deleteUser(uid: string): Promise<void> {
    const call = httpsCallable<{ uid: string }, { ok: true }>(this.functions, 'deleteAdminUser');
    await call({ uid });
  }

  async resetPassword(uid: string, temporaryPassword: string): Promise<void> {
    const call = httpsCallable<{ uid: string; temporaryPassword: string }, { ok: true }>(
      this.functions,
      'resetAdminPassword'
    );
    await call({ uid, temporaryPassword });
  }

  async updateUser(payload: {
    uid: string;
    displayName: string;
    role: ManagedUser['role'];
  }): Promise<void> {
    const call = httpsCallable<typeof payload, { ok: true }>(this.functions, 'updateAdminUser');
    await call(payload);
  }

  async clearOwnMustChangePassword(): Promise<void> {
    const call = httpsCallable<unknown, { ok: true }>(this.functions, 'clearOwnMustChangePassword');
    await call({});
  }
}
