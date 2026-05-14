import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

function clearCorruptFirebaseStorage(storage: Storage): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (!key) {
      continue;
    }
    const isFirebaseBrowserKey =
      key.startsWith('firebase:') || key.startsWith('firebaseLocalStorage');
    if (!isFirebaseBrowserKey) {
      continue;
    }
    const value = storage.getItem(key);
    if (value == null) {
      continue;
    }
    const trimmed = value.trim();
    if (trimmed === '[object Object]' || trimmed === 'undefined') {
      keysToRemove.push(key);
      continue;
    }
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        JSON.parse(trimmed);
      } catch {
        keysToRemove.push(key);
      }
    }
  }
  keysToRemove.forEach((key) => storage.removeItem(key));
}

function sanitizeBrowserStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    clearCorruptFirebaseStorage(window.localStorage);
    clearCorruptFirebaseStorage(window.sessionStorage);
  } catch {
    // Storage may be blocked in private modes; ignore and continue app startup.
  }
}

sanitizeBrowserStorage();

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
