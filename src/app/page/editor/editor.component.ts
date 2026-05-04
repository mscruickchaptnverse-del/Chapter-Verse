import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';

import { DEFAULT_HOME_PAGE_CONTENT, HomePageContent } from '../../core/models/home-page-content';
import { AdminUsersService, ManagedUser } from '../../core/services/admin-users.service';
import { HomeContentStorageService } from '../../core/services/home-content-storage.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html'
})
export class EditorComponent implements OnInit {
  hasChanges = false;
  saveMessage = '';
  isBold = false;
  isItalic = true;
  isUnderline = false;
  textAlign: 'left' | 'center' | 'right' = 'left';
  selectedFont = 'Inter';
  selectedSize = '16px';
  pendingManagedName = '';
  pendingManagedEmail = '';
  pendingManagedRole: ManagedUser['role'] = 'Editor';
  pendingManagedTempPassword = '';
  managedUsers: ManagedUser[] = [];
  adminMessage = '';
  syncingAdmins = false;

  form: HomePageContent = { ...DEFAULT_HOME_PAGE_CONTENT };
  baseline: HomePageContent = { ...DEFAULT_HOME_PAGE_CONTENT };

  constructor(
    private readonly auth: Auth,
    private readonly router: Router,
    private readonly homeContentStorage: HomeContentStorageService,
    private readonly adminUsersService: AdminUsersService
  ) {}

  ngOnInit(): void {
    this.homeContentStorage.load().subscribe((data) => {
      this.form = this.cloneContent(data);
      this.baseline = this.cloneContent(data);
      this.hasChanges = false;
      this.saveMessage = '';
    });
    void this.refreshManagedUsers();
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    await this.router.navigate(['/sign-in']);
  }

  toggleBold(): void {
    this.isBold = !this.isBold;
  }

  toggleItalic(): void {
    this.isItalic = !this.isItalic;
  }

  toggleUnderline(): void {
    this.isUnderline = !this.isUnderline;
  }

  setTextAlign(align: 'left' | 'center' | 'right'): void {
    this.textAlign = align;
  }

  updateFont(event: Event): void {
    this.selectedFont = (event.target as HTMLSelectElement).value;
  }

  updateSize(event: Event): void {
    this.selectedSize = (event.target as HTMLSelectElement).value;
  }

  onInput(key: keyof HomePageContent, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.form = { ...this.form, [key]: target.value };
    this.hasChanges = true;
    this.saveMessage = '';
  }

  async addManagedUser(): Promise<void> {
    const email = this.pendingManagedEmail.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const name = this.pendingManagedName.trim();
    const temporaryPassword = this.pendingManagedTempPassword.trim();

    if (!email || !name || !temporaryPassword) {
      this.adminMessage = 'Enter name, email, and a temporary password.';
      return;
    }
    if (!emailPattern.test(email)) {
      this.adminMessage = 'Enter a valid email address.';
      return;
    }
    if (temporaryPassword.length < 8) {
      this.adminMessage = 'Temporary password must be at least 8 characters.';
      return;
    }

    try {
      await this.adminUsersService.createUser({
        email,
        displayName: name,
        role: this.pendingManagedRole,
        temporaryPassword
      });
      this.pendingManagedName = '';
      this.pendingManagedEmail = '';
      this.pendingManagedRole = 'Editor';
      this.pendingManagedTempPassword = '';
      this.adminMessage = 'User created in Firebase Auth. They must change password on first sign-in.';
      await this.refreshManagedUsers();
    } catch {
      this.adminMessage = 'Could not create user. Confirm you are signed in as an owner and try again.';
    }
  }

  async deleteManagedUser(uid: string): Promise<void> {
    try {
      await this.adminUsersService.deleteUser(uid);
      this.adminMessage = 'User deleted.';
      await this.refreshManagedUsers();
    } catch {
      this.adminMessage = 'Delete failed.';
    }
  }

  async saveManagedUser(user: ManagedUser): Promise<void> {
    try {
      await this.adminUsersService.updateUser({
        uid: user.uid,
        displayName: user.displayName,
        role: user.role
      });
      this.adminMessage = 'User updated.';
    } catch {
      this.adminMessage = 'Could not update user.';
    }
  }

  async resetManagedPassword(uid: string): Promise<void> {
    const temporaryPassword = window.prompt('Enter new temporary password (min 8 characters):', '');
    if (!temporaryPassword) {
      return;
    }
    if (temporaryPassword.trim().length < 8) {
      this.adminMessage = 'Temporary password must be at least 8 characters.';
      return;
    }

    try {
      await this.adminUsersService.resetPassword(uid, temporaryPassword.trim());
      this.adminMessage = 'Temporary password set. User will be prompted to change it.';
      await this.refreshManagedUsers();
    } catch {
      this.adminMessage = 'Could not reset password.';
    }
  }

  discardChanges(): void {
    this.form = this.cloneContent(this.baseline);
    this.hasChanges = false;
    this.saveMessage = 'Changes discarded.';
    this.adminMessage = '';
  }

  async publishChanges(): Promise<void> {
    if (!this.hasChanges) {
      return;
    }
    this.saveMessage = 'Publishing…';
    try {
      await this.homeContentStorage.save(this.form);
      this.baseline = this.cloneContent(this.form);
      this.hasChanges = false;
      this.saveMessage = 'Published to Firebase Storage.';
      this.adminMessage = '';
    } catch {
      this.saveMessage =
        'Could not save. Sign in to the editor and allow Storage writes for authenticated users.';
    }
  }

  get previewClassMap(): Record<string, boolean> {
    return {
      'font-bold': this.isBold,
      italic: this.isItalic,
      underline: this.isUnderline,
      'text-left': this.textAlign === 'left',
      'text-center': this.textAlign === 'center',
      'text-right': this.textAlign === 'right',
      'font-sans': this.selectedFont === 'Inter',
      'font-serif': this.selectedFont !== 'Inter'
    };
  }

  getAdminInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '--';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  private markDirty(): void {
    this.hasChanges = true;
    this.saveMessage = '';
  }

  private cloneContent(content: HomePageContent): HomePageContent {
    return {
      ...content,
      adminUsers: content.adminUsers.map((user) => ({ ...user }))
    };
  }

  private async refreshManagedUsers(): Promise<void> {
    this.syncingAdmins = true;
    try {
      this.managedUsers = await this.adminUsersService.listUsers();
      this.adminMessage = '';
    } catch {
      this.adminMessage = 'Could not load users from Firebase.';
    } finally {
      this.syncingAdmins = false;
    }
  }
}
