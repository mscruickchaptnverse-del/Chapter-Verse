import { Component, OnDestroy, OnInit } from '@angular/core';
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

type EditorToastVariant = 'success' | 'error' | 'info';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html'
})
export class EditorComponent implements OnInit, OnDestroy {
  private readonly maxUndoSteps = 45;
  private readonly pastForm: HomePageContent[] = [];
  private readonly futureForm: HomePageContent[] = [];
  private restoringFromHistory = false;
  private toastClearId: ReturnType<typeof setTimeout> | null = null;

  toastMessage = '';
  toastVariant: EditorToastVariant = 'info';
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

  ngOnDestroy(): void {
    if (this.toastClearId !== null) {
      clearTimeout(this.toastClearId);
      this.toastClearId = null;
    }
  }

  get canUndo(): boolean {
    return this.pastForm.length > 0;
  }

  get canRedo(): boolean {
    return this.futureForm.length > 0;
  }

  private async applyLoadedContent(data: HomePageContent): Promise<void> {
    this.clearUndoStacks();
    const draft = await this.homeContentStorage.loadDraftFromFirestore();
    if (draft) {
      this.form = this.cloneContent(draft);
      this.baseline = this.cloneContent(data);
      this.showToast('Draft restored from Firestore.', 'info');
      return;
    }
    this.form = this.cloneContent(data);
    this.baseline = this.cloneContent(data);
  }

  /** True when published snapshot differs from the form (avoids a stale `hasChanges` flag blocking Publish). */
  get hasUnpublishedEdits(): boolean {
    return JSON.stringify(this.form) !== JSON.stringify(this.baseline);
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
    this.pushHistoryBeforeChange();
    this.form = { ...this.form, [key]: target.value };
    this.homeContentStorage.saveDraft(this.form);
  }

  undo(): void {
    if (!this.canUndo) {
      this.showToast('Nothing to undo.', 'info', 2200);
      return;
    }
    this.restoringFromHistory = true;
    this.futureForm.push(this.cloneContent(this.form));
    const prev = this.pastForm.pop()!;
    this.form = prev;
    this.restoringFromHistory = false;
    this.homeContentStorage.saveDraft(this.form);
    this.showToast('Undone.', 'info', 2200);
  }

  redo(): void {
    if (!this.canRedo) {
      this.showToast('Nothing to redo.', 'info', 2200);
      return;
    }
    this.restoringFromHistory = true;
    this.pastForm.push(this.cloneContent(this.form));
    const next = this.futureForm.pop()!;
    this.form = next;
    this.restoringFromHistory = false;
    this.homeContentStorage.saveDraft(this.form);
    this.showToast('Redone.', 'info', 2200);
  }

  async discardChanges(): Promise<void> {
    this.clearUndoStacks();
    this.form = this.cloneContent(this.baseline);
    await this.homeContentStorage.clearDraft();
    this.showToast('Changes discarded.', 'info');
  }

  async publishChanges(): Promise<void> {
    if (!this.hasUnpublishedEdits) {
      this.showToast('No changes to publish.', 'info');
      return;
    }
    this.showToast('Publishing…', 'info', 2000);
    try {
      await this.homeContentStorage.save(this.form);
      this.baseline = this.cloneContent(this.form);
      this.clearUndoStacks();
      await this.homeContentStorage.clearDraft();
      this.showToast('Published. Reload the public site to see updates.', 'success');
    } catch (err: unknown) {
      console.error('Publish to Firestore failed', err);
      const code =
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof (err as { code?: unknown }).code === 'string'
          ? (err as { code: string }).code
          : '';
      if (code === 'permission-denied') {
        this.showToast(
          'Permission denied. Deploy Firestore rules and sign in with an allowed account.',
          'error'
        );
      } else {
        this.showToast(
          'Could not publish. Sign in, check the console, and confirm Firestore rules allow writes to site/homePage.',
          'error'
        );
      }
    }
  }

  dismissToast(): void {
    if (this.toastClearId !== null) {
      clearTimeout(this.toastClearId);
      this.toastClearId = null;
    }
    this.toastMessage = '';
  }

  showToast(message: string, variant: EditorToastVariant = 'info', durationMs?: number): void {
    if (this.toastClearId !== null) {
      clearTimeout(this.toastClearId);
      this.toastClearId = null;
    }
    this.toastMessage = message;
    this.toastVariant = variant;
    const ms =
      durationMs ??
      (variant === 'error' ? 8000 : variant === 'success' ? 5500 : 4200);
    this.toastClearId = setTimeout(() => {
      this.toastClearId = null;
      this.toastMessage = '';
    }, ms);
  }

  private pushHistoryBeforeChange(): void {
    if (this.restoringFromHistory) {
      return;
    }
    this.pastForm.push(this.cloneContent(this.form));
    if (this.pastForm.length > this.maxUndoSteps) {
      this.pastForm.shift();
    }
    this.futureForm.length = 0;
  }

  private clearUndoStacks(): void {
    this.pastForm.length = 0;
    this.futureForm.length = 0;
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
