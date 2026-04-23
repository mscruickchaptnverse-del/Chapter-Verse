import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent implements AfterViewInit {
  activeSection: 'hero' | 'philosophy' | 'charters' = 'hero';
  mobileMenuOpen = false;
  indicatorLeft = 0;
  indicatorWidth = 0;
  indicatorReady = false;

  private readonly sectionIds = ['hero', 'philosophy', 'charters'] as const;
  private scrollListenerScheduled = false;
  @ViewChild('navHero') private navHero?: ElementRef<HTMLElement>;
  @ViewChild('navPhilosophy') private navPhilosophy?: ElementRef<HTMLElement>;
  @ViewChild('navCharters') private navCharters?: ElementRef<HTMLElement>;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router
  ) {}

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      this.updateActiveFromScrollPosition();
      this.updateIndicator();
      const hash = window.location.hash.replace('#', '');
      if (hash && this.sectionIds.includes(hash as (typeof this.sectionIds)[number])) {
        this.scrollToSectionId(hash as 'hero' | 'philosophy' | 'charters');
      }
    });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.scrollListenerScheduled) {
      return;
    }
    this.scrollListenerScheduled = true;
    requestAnimationFrame(() => {
      this.scrollListenerScheduled = false;
      this.updateActiveFromScrollPosition();
    });
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (window.innerWidth >= 768) {
      this.mobileMenuOpen = false;
    }
    this.updateIndicator();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  /** Home nav: scroll to hero when already on `/` */
  onHomeNavClick(event: MouseEvent): void {
    const path = this.router.url.split('?')[0];
    if (path === '/' || path === '') {
      event.preventDefault();
      this.scrollToSectionId('hero');
    }
  }

  scrollToSection(event: Event, sectionId: 'hero' | 'philosophy' | 'charters'): void {
    event.preventDefault();
    this.scrollToSectionId(sectionId);
  }

  /** Native smooth scroll (respects reduced-motion + section `scroll-mt-*`) */
  private scrollToSectionId(sectionId: 'hero' | 'philosophy' | 'charters'): void {
    const el = document.getElementById(sectionId);
    if (!el) {
      return;
    }

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    el.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start'
    });

    queueMicrotask(() => this.updateActiveFromScrollPosition());
  }

  private updateActiveFromScrollPosition(): void {
    const headerEl = document.querySelector('app-home header');
    const headerH = headerEl instanceof HTMLElement ? headerEl.offsetHeight : 72;
    const band = headerH + 24;
    const y = window.scrollY + band;

    const heroEl = document.getElementById('hero');
    const philEl = document.getElementById('philosophy');
    const chartEl = document.getElementById('charters');
    if (!heroEl || !philEl || !chartEl) {
      return;
    }

    const top = (node: HTMLElement) => node.getBoundingClientRect().top + window.scrollY;
    const tPhil = top(philEl);
    const tChart = top(chartEl);

    let next: typeof this.activeSection = 'hero';
    if (y >= tChart) {
      next = 'charters';
    } else if (y >= tPhil) {
      next = 'philosophy';
    }

    if (next !== this.activeSection) {
      this.activeSection = next;
      this.updateIndicator();
      this.cdr.markForCheck();
    }
  }

  private updateIndicator(): void {
    const target =
      this.activeSection === 'hero'
        ? this.navHero?.nativeElement
        : this.activeSection === 'philosophy'
          ? this.navPhilosophy?.nativeElement
          : this.navCharters?.nativeElement;

    if (!target || !target.parentElement) {
      this.indicatorReady = false;
      return;
    }

    const navRect = target.parentElement.getBoundingClientRect();
    const linkRect = target.getBoundingClientRect();
    this.indicatorLeft = linkRect.left - navRect.left;
    this.indicatorWidth = linkRect.width;
    this.indicatorReady = linkRect.width > 0;
  }
}
