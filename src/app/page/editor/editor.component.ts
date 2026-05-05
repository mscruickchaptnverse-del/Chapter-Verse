import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';

import { DEFAULT_HOME_PAGE_CONTENT, HomePageContent } from '../../core/models/home-page-content';
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

  form: HomePageContent = { ...DEFAULT_HOME_PAGE_CONTENT };
  baseline: HomePageContent = { ...DEFAULT_HOME_PAGE_CONTENT };

  constructor(
    private readonly auth: Auth,
    private readonly router: Router,
    private readonly homeContentStorage: HomeContentStorageService
  ) {}

  ngOnInit(): void {
    this.homeContentStorage.load().subscribe((data) => {
      this.form = this.cloneContent(data);
      this.baseline = this.cloneContent(data);
      this.hasChanges = false;
      this.saveMessage = '';
    });
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

  discardChanges(): void {
    this.form = this.cloneContent(this.baseline);
    this.hasChanges = false;
    this.saveMessage = 'Changes discarded.';
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

  private cloneContent(content: HomePageContent): HomePageContent {
    return {
      ...content,
      adminUsers: content.adminUsers.map((user) => ({ ...user }))
    };
  }
}
