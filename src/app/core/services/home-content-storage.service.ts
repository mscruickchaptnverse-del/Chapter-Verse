import { Injectable } from '@angular/core';
import { Firestore, deleteDoc, doc, getDoc, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import {
  DEFAULT_HOME_PAGE_CONTENT,
  HomePageContent,
  mergeHomePageContent
} from '../models/home-page-content';

/** Firestore paths for homepage CMS (see `firestore.rules`). */
const PUBLISHED_DOC = ['site', 'homePage'] as const;
const DRAFT_DOC = ['site', 'homePageDraft'] as const;

/**
 * Persists homepage copy in Cloud Firestore (`site/homePage`).
 * Editor drafts use `site/homePageDraft` (authenticated read/write).
 */
@Injectable({
  providedIn: 'root'
})
export class HomeContentStorageService {
  private draftSaveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly firestore: Firestore) {}

  load(): Observable<HomePageContent> {
    return from(getDoc(doc(this.firestore, ...PUBLISHED_DOC))).pipe(
      map((snap) => {
        if (!snap.exists()) {
          return { ...DEFAULT_HOME_PAGE_CONTENT };
        }
        const data = snap.data() as { content?: unknown };
        return mergeHomePageContent(data.content ?? {});
      }),
      catchError(() => of({ ...DEFAULT_HOME_PAGE_CONTENT }))
    );
  }

  async save(content: HomePageContent): Promise<void> {
    await setDoc(
      doc(this.firestore, ...PUBLISHED_DOC),
      {
        content,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    await this.clearDraftFirestore();
  }

  /** Loads editor draft from Firestore (null if none or not permitted). */
  async loadDraftFromFirestore(): Promise<HomePageContent | null> {
    try {
      const snap = await getDoc(doc(this.firestore, ...DRAFT_DOC));
      if (!snap.exists()) {
        return null;
      }
      const data = snap.data() as { content?: unknown };
      if (!data.content || typeof data.content !== 'object') {
        return null;
      }
      return mergeHomePageContent(data.content);
    } catch {
      return null;
    }
  }

  /** Debounced draft write to reduce Firestore writes while typing. */
  saveDraft(content: HomePageContent): void {
    if (this.draftSaveTimer !== null) {
      clearTimeout(this.draftSaveTimer);
    }
    this.draftSaveTimer = setTimeout(() => {
      this.draftSaveTimer = null;
      void this.flushDraft(content);
    }, 650);
  }

  async clearDraft(): Promise<void> {
    if (this.draftSaveTimer !== null) {
      clearTimeout(this.draftSaveTimer);
      this.draftSaveTimer = null;
    }
    await this.clearDraftFirestore();
  }

  private async flushDraft(content: HomePageContent): Promise<void> {
    try {
      await setDoc(
        doc(this.firestore, ...DRAFT_DOC),
        {
          content,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch {
      // Ignore draft persistence failures (offline, rules, etc.).
    }
  }

  private async clearDraftFirestore(): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, ...DRAFT_DOC));
    } catch {
      // Missing draft or permission: safe to ignore.
    }
  }
}
