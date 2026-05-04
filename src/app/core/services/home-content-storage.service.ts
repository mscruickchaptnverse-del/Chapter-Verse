import { Injectable } from '@angular/core';
import { Storage, getBytes, ref, uploadString } from '@angular/fire/storage';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  DEFAULT_HOME_PAGE_CONTENT,
  HomePageContent,
  mergeHomePageContent
} from '../models/home-page-content';

/**
 * Persists homepage copy as JSON in Firebase Storage.
 * Set Storage rules so authenticated users can write and the site can read (e.g. public read on this path).
 */
@Injectable({
  providedIn: 'root'
})
export class HomeContentStorageService {
  private readonly objectPath =
    environment.homePageStoragePath ?? 'cms/home-page.json';
  private readonly localDraftKey = 'homePageContent.local';

  constructor(private readonly storage: Storage) {}

  load(): Observable<HomePageContent> {
    const storageRef = ref(this.storage, this.objectPath);
    return from(getBytes(storageRef)).pipe(
      map((bytes) => this.parseJsonBytes(bytes)),
      map((json) => mergeHomePageContent(json)),
      catchError(() => of(this.loadLocalDraft()))
    );
  }

  async save(content: HomePageContent): Promise<void> {
    const storageRef = ref(this.storage, this.objectPath);
    const body = JSON.stringify(content, null, 2);
    try {
      await uploadString(storageRef, body, 'raw', {
        contentType: 'application/json; charset=utf-8'
      });
      this.saveLocalDraft(content);
    } catch (error) {
      this.saveLocalDraft(content);
      throw error;
    }
  }

  private parseJsonBytes(bytes: ArrayBuffer): unknown {
    const text = new TextDecoder('utf-8').decode(new Uint8Array(bytes));
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Invalid JSON in home page content file.');
    }
  }

  private loadLocalDraft(): HomePageContent {
    try {
      const raw = window.localStorage.getItem(this.localDraftKey);
      if (!raw) {
        return { ...DEFAULT_HOME_PAGE_CONTENT };
      }
      return mergeHomePageContent(JSON.parse(raw));
    } catch {
      return { ...DEFAULT_HOME_PAGE_CONTENT };
    }
  }

  private saveLocalDraft(content: HomePageContent): void {
    window.localStorage.setItem(this.localDraftKey, JSON.stringify(content));
  }
}
