import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  Router,
  RouterModule,
  NavigationEnd
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';

import { TranslationService } from '../../../core/i18n/translation.service';
import { PageTransitionService } from '../../../core/services/page-transition.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isLanguageOpen = false;
  isClosing = false;

  currentRoute = '/';

  private routeSub?: Subscription;

  constructor(
    public translation: TranslationService,
    private router: Router,
    private pageTransition: PageTransitionService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentRoute = window.location.pathname;

    this.routeSub = this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
      .subscribe((event) => {
        console.log(
          '[navbar] NavigationEnd recibido:',
          event.urlAfterRedirects
        );

        this.currentRoute = event.urlAfterRedirects;

        this.ngZone.run(() => {
          this.cdr.detectChanges();
        });
      });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  isActive(path: string): boolean {
    if (path === '/') {
      return this.currentRoute === '/';
    }

    return this.currentRoute.startsWith(path);
  }

  async goTo(path: string): Promise<void> {
    this.isMenuOpen = false;
    this.isLanguageOpen = false;

    if (this.isActive(path)) {
      return;
    }

    this.currentRoute = path;

    await this.pageTransition.navigateWithTransition(path);

    this.currentRoute = window.location.pathname;

    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    this.isLanguageOpen = false;
  }

  toggleLanguageMenu(): void {
    this.isLanguageOpen = !this.isLanguageOpen;
  }

  async changeLanguage(lang: 'es' | 'en'): Promise<void> {
    if (lang === this.translation.currentLanguage) {
      return;
    }

    await this.pageTransition.reloadWithTransition(() => {
      this.translation.setLanguage(lang);
      this.isLanguageOpen = false;
      this.isMenuOpen = false;
    });
  }

  get currentFlag(): string {
    return this.translation.currentLanguage === 'es'
      ? 'https://flagcdn.com/mx.svg'
      : 'https://flagcdn.com/us.svg';
  }

  get currentLabel(): string {
    return this.translation.currentLanguage === 'es'
      ? 'ES'
      : 'EN';
  }
}