import { Injectable } from '@angular/core';
import { Storage, ref, uploadString } from '@angular/fire/storage';
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
  private readonly publicDownloadUrl = this.buildPublicDownloadUrl();
  private readonly useLocalDraftOnly =
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost' &&
    !environment.production;

  constructor(private readonly storage: Storage) {}

  load(): Observable<HomePageContent> {
    if (this.useLocalDraftOnly) {
      return of(this.loadLocalDraft());
    }
    return from(this.fetchPublicJson()).pipe(
      map((json) => mergeHomePageContent(json)),
      catchError(() => of(this.loadLocalDraft()))
    );
  }

  async save(content: HomePageContent): Promise<void> {
    if (this.useLocalDraftOnly) {
      this.saveLocalDraft(content);
      return;
    }
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

  private async fetchPublicJson(): Promise<unknown> {
    const response = await fetch(this.publicDownloadUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store'
    });
    if (!response.ok) {
      throw new Error(`Home content request failed (${response.status}).`);
    }
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      // Guard legacy bad payloads like "[object Object]" and fall back safely.
      if (text.trim() === '[object Object]') {
        return {};
      }
      throw new Error('Invalid JSON in home page content file.');
    }
  }

  private buildPublicDownloadUrl(): string {
    const bucket = environment.firebase.storageBucket;
    const encodedPath = encodeURIComponent(this.objectPath);
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
  }

  private loadLocalDraft(): HomePageContent {
    try {
      const raw = window.localStorage.getItem(this.localDraftKey);
      if (!raw) {
        return { ...DEFAULT_HOME_PAGE_CONTENT };
      }
      if (raw.trim() === '[object Object]') {
        window.localStorage.removeItem(this.localDraftKey);
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
