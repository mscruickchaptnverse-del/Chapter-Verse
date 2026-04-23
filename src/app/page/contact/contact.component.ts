import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import emailjs from '@emailjs/browser';
import { Subscription } from 'rxjs';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html'
})
export class ContactComponent implements AfterViewInit, OnDestroy {
  fullName = '';
  email = '';
  message = '';
  /** Maps to EmailJS template variables: from_name, from_email, message */
  submitStatus: 'idle' | 'sending' | 'success' | 'error' = 'idle';
  submitErrorDetail = '';
  mobileMenuOpen = false;
  activeNav: 'home' | 'contact' = 'contact';
  indicatorLeft = 0;
  indicatorWidth = 0;
  indicatorReady = false;

  @ViewChild('navHome') private navHome?: ElementRef<HTMLElement>;
  @ViewChild('navContact') private navContact?: ElementRef<HTMLElement>;
  private navSub?: Subscription;

  constructor(
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    if (this.emailJsConfigured()) {
      emailjs.init({ publicKey: environment.emailjs.publicKey });
    }
    this.updateNavState();
    this.updateIndicator();
    this.navSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateNavState();
        // Wait a microtask so layout is stable before measuring
        queueMicrotask(() => this.updateIndicator());
      }
    });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  @HostListener('window:resize')
  onResize(): void {
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

  onNameInput(event: Event): void {
    this.fullName = (event.target as HTMLInputElement).value;
  }

  onEmailInput(event: Event): void {
    this.email = (event.target as HTMLInputElement).value;
  }

  onMessageInput(event: Event): void {
    this.message = (event.target as HTMLTextAreaElement).value;
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.submitStatus === 'sending') {
      return;
    }
    this.submitErrorDetail = '';
    this.submitStatus = 'idle';

    if (!this.emailJsConfigured()) {
      this.submitStatus = 'error';
      this.submitErrorDetail =
        'Contact form is not configured yet. Add your EmailJS keys in src/environments/environment.ts.';
      return;
    }

    const name = this.fullName.trim();
    const address = this.email.trim();
    const body = this.message.trim();

    if (!name || !address || !body) {
      this.submitStatus = 'error';
      this.submitErrorDetail = 'Please fill in your name, email, and message.';
      return;
    }

    if (!this.isValidEmail(address)) {
      this.submitStatus = 'error';
      this.submitErrorDetail = 'Please enter a valid email address.';
      return;
    }

    this.submitStatus = 'sending';

    try {
      await emailjs.send(environment.emailjs.serviceId, environment.emailjs.templateId, {
        from_name: name,
        from_email: address,
        message: body
      });
      this.fullName = '';
      this.email = '';
      this.message = '';
      this.submitStatus = 'success';
    } catch (err: unknown) {
      this.submitStatus = 'error';
      this.submitErrorDetail = this.describeEmailJsError(err);
    } finally {
      this.cdr.markForCheck();
    }
  }

  private emailJsConfigured(): boolean {
    const { publicKey, serviceId, templateId } = environment.emailjs;
    return (
      publicKey.trim() !== '' &&
      serviceId.trim() !== '' &&
      templateId.trim() !== ''
    );
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private describeEmailJsError(err: unknown): string {
    if (
      typeof err === 'object' &&
      err !== null &&
      'text' in err &&
      typeof (err as { text?: unknown }).text === 'string' &&
      (err as { text: string }).text.trim() !== ''
    ) {
      return (err as { text: string }).text;
    }
    return 'Something went wrong sending your message. Please try again or email us directly.';
  }

  private updateNavState(): void {
    const path = this.router.url.split('?')[0];
    this.activeNav = path === '/contact' ? 'contact' : 'home';
    this.cdr.markForCheck();
  }

  private updateIndicator(): void {
    const target =
      this.activeNav === 'contact'
        ? this.navContact?.nativeElement
        : this.navHome?.nativeElement;

    if (!target || !target.parentElement) {
      this.indicatorReady = false;
      return;
    }

    const navRect = target.parentElement.getBoundingClientRect();
    const linkRect = target.getBoundingClientRect();
    this.indicatorLeft = linkRect.left - navRect.left;
    this.indicatorWidth = linkRect.width;
    this.indicatorReady = linkRect.width > 0;
    this.cdr.markForCheck();
  }
}
