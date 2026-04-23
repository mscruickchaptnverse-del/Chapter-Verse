import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';

type EditableSection = 'hero' | 'philosophy' | 'cta';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html'
})
export class EditorComponent {
  section: EditableSection = 'hero';
  hasChanges = false;
  saveMessage = '';
  isBold = false;
  isItalic = true;
  isUnderline = false;
  textAlign: 'left' | 'center' | 'right' = 'left';
  selectedFont = 'Inter';
  selectedSize = '16px';

  readonly snapshot = {
    heroEyebrow: 'CHAPTER & VERSE CHARTERS, LLC',
    heroTitleTop: 'Products For Every',
    heroTitleBottom: 'Chapter of Her Life.',
    heroBody:
      'Thoughtfully curated essentials for every transition, so the details of your day support the story you are living.',
    primaryCta: 'Shop the collection',
    secondaryCta: 'Learn our philosophy',
    philosophyTitle: 'Practicality as a Promise.',
    philosophyBody:
      'We design for rhythm, not trends. Every section can be curated here before publishing.',
    ctaTitle: 'Write Your Next Chapter.',
    ctaBody:
      'Use this console to update homepage copy and review content before pushing live.'
  };

  form = { ...this.snapshot };

  constructor(
    private readonly auth: Auth,
    private readonly router: Router
  ) {}

  async logout(): Promise<void> {
    await signOut(this.auth);
    await this.router.navigate(['/sign-in']);
  }

  setSection(section: EditableSection): void {
    this.section = section;
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

  onInput<K extends keyof typeof this.form>(key: K, event: Event): void {
    this.form[key] = (event.target as HTMLInputElement | HTMLTextAreaElement).value as (typeof this.form)[K];
    this.hasChanges = true;
    this.saveMessage = '';
  }

  discardChanges(): void {
    this.form = { ...this.snapshot };
    this.hasChanges = false;
    this.saveMessage = 'Changes discarded.';
  }

  publishChanges(): void {
    // Placeholder until backend persistence is added.
    this.hasChanges = false;
    this.saveMessage = 'Draft saved locally. Connect backend to publish live.';
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
}
