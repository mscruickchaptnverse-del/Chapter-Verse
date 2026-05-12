import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';

import { DEFAULT_HOME_PAGE_CONTENT, HomePageContent } from '../../core/models/home-page-content';
import { HomeContentStorageService } from '../../core/services/home-content-storage.service';

type FieldStyle = {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  textAlign: 'left' | 'center' | 'right';
  font: string;
  size: string;
};

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
  activeField: keyof HomePageContent | null = null;
  private readonly fieldStyles: Partial<Record<keyof HomePageContent, FieldStyle>> = {};

  form: HomePageContent = { ...DEFAULT_HOME_PAGE_CONTENT };
  baseline: HomePageContent = { ...DEFAULT_HOME_PAGE_CONTENT };

  constructor(
    private readonly auth: Auth,
    private readonly router: Router,
    private readonly homeContentStorage: HomeContentStorageService
  ) {}

  ngOnInit(): void {
    this.homeContentStorage.load().subscribe((data) => {
      void this.applyLoadedContent(data);
    });
  }

  private async applyLoadedContent(data: HomePageContent): Promise<void> {
    const draft = await this.homeContentStorage.loadDraftFromFirestore();
    if (draft) {
      this.form = this.cloneContent(draft);
      this.baseline = this.cloneContent(data);
      this.hasChanges = true;
      this.saveMessage = 'Draft restored from Firestore.';
      return;
    }
    this.form = this.cloneContent(data);
    this.baseline = this.cloneContent(data);
    this.hasChanges = false;
    this.saveMessage = '';
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    await this.router.navigate(['/sign-in']);
  }

  toggleBold(): void {
    this.isBold = !this.isBold;
    this.syncActiveFieldStyle();
  }

  toggleItalic(): void {
    this.isItalic = !this.isItalic;
    this.syncActiveFieldStyle();
  }

  toggleUnderline(): void {
    this.isUnderline = !this.isUnderline;
    this.syncActiveFieldStyle();
  }

  setTextAlign(align: 'left' | 'center' | 'right'): void {
    this.textAlign = align;
    this.syncActiveFieldStyle();
  }

  updateFont(event: Event): void {
    this.selectedFont = (event.target as HTMLSelectElement).value;
    this.syncActiveFieldStyle();
  }

  updateSize(event: Event): void {
    this.selectedSize = (event.target as HTMLSelectElement).value;
    this.syncActiveFieldStyle();
  }

  setActiveField(field: keyof HomePageContent): void {
    this.activeField = field;
    const style = this.getFieldStyle(field);
    this.isBold = style.isBold;
    this.isItalic = style.isItalic;
    this.isUnderline = style.isUnderline;
    this.textAlign = style.textAlign;
    this.selectedFont = style.font;
    this.selectedSize = style.size;
  }

  isActiveField(field: keyof HomePageContent): boolean {
    return this.activeField === field;
  }

  keepFieldFocus(event: MouseEvent): void {
    event.preventDefault();
  }

  fieldClassMap(field: keyof HomePageContent): Record<string, boolean> | null {
    const style = this.getFieldStyle(field);
    return {
      'font-bold': style.isBold,
      italic: style.isItalic,
      underline: style.isUnderline,
      'text-left': style.textAlign === 'left',
      'text-center': style.textAlign === 'center',
      'text-right': style.textAlign === 'right',
      'font-sans': style.font === 'Inter',
      'font-serif': style.font !== 'Inter'
    };
  }

  fieldFontSize(field: keyof HomePageContent): string | null {
    return this.getFieldStyle(field).size;
  }

  onInput(key: keyof HomePageContent, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.form = { ...this.form, [key]: target.value };
    this.hasChanges = true;
    this.homeContentStorage.saveDraft(this.form);
    this.saveMessage = 'Draft saved.';
  }

  async discardChanges(): Promise<void> {
    this.form = this.cloneContent(this.baseline);
    this.hasChanges = false;
    await this.homeContentStorage.clearDraft();
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
      await this.homeContentStorage.clearDraft();
      this.saveMessage = 'Published to Firestore.';
    } catch {
      this.saveMessage =
        'Could not save. Sign in to the editor and deploy Firestore rules so signed-in users can write site/homePage.';
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

  private getFieldStyle(field: keyof HomePageContent): FieldStyle {
    if (!this.fieldStyles[field]) {
      this.fieldStyles[field] = {
        isBold: false,
        isItalic: true,
        isUnderline: false,
        textAlign: 'left',
        font: 'Inter',
        size: '16px'
      };
    }
    return this.fieldStyles[field] as FieldStyle;
  }

  private syncActiveFieldStyle(): void {
    if (!this.activeField) {
      return;
    }
    this.fieldStyles[this.activeField] = {
      isBold: this.isBold,
      isItalic: this.isItalic,
      isUnderline: this.isUnderline,
      textAlign: this.textAlign,
      font: this.selectedFont,
      size: this.selectedSize
    };
  }
}
