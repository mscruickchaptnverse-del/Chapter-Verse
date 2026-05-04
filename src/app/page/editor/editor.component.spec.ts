import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Auth } from '@angular/fire/auth';
import { of } from 'rxjs';

import { DEFAULT_HOME_PAGE_CONTENT } from '../../core/models/home-page-content';
import { HomeContentStorageService } from '../../core/services/home-content-storage.service';
import { EditorComponent } from './editor.component';

describe('EditorComponent', () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [EditorComponent],
      providers: [
        { provide: Auth, useValue: {} },
        {
          provide: HomeContentStorageService,
          useValue: {
            load: () => of({ ...DEFAULT_HOME_PAGE_CONTENT }),
            save: async (): Promise<void> => undefined
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
