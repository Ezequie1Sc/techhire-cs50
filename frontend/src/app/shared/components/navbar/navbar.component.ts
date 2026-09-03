import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
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
    // Para el valor inicial usamos window.location.pathname en vez de
    // router.url. router.url puede seguir valiendo '/' (su default) si
    // el componente se inicializa antes de que el Router termine de
    // resolver su navegación inicial (guards, resolvers, chunks lazy),
    // algo común justo después de un location.reload(). Como no hay un
    // NavigationEnd posterior si ya estás en esa misma ruta, el navbar
    // se quedaba marcando "Home" para siempre. window.location.pathname
    // en cambio refleja la URL real del navegador de forma síncrona e
    // inmediata, sin depender del estado interno del Router.
    this.currentRoute = window.location.pathname;

    this.routeSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        // TEMPORAL: diagnóstico. Abre la consola del navegador y navega
        // desde un botón de Home. Si NO ves este log, el problema es que
        // el evento nunca llega (navbar duplicado / router distinto /
        // navegación que no pasa por Angular Router). Si SÍ lo ves pero
        // el navbar no se pinta, el problema es de detección de cambios.
        console.log('[navbar] NavigationEnd recibido:', event.urlAfterRedirects);

        // urlAfterRedirects viene directo del evento NavigationEnd, que
        // solo se dispara cuando la navegación terminó con éxito (ya
        // incluye redirects resueltos).
        this.currentRoute = event.urlAfterRedirects;

        // Forzamos detección de cambios explícita, además de ngZone.run.
        // Esto cubre el caso de que el ciclo normal de CD no repinte la
        // vista (p. ej. si el proyecto usa change detection zoneless, o
        // si la promesa de GSAP resolvió de forma tal que el tick
        // automático de Angular no se disparó). Sin esto, el dato
        // interno (currentRoute) cambia correctamente pero el DOM
        // ([class.nav-active]) nunca se actualiza visualmente.
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

    if (this.isActive(path)) return;

    // Actualización optimista: refleja el cambio en el navbar de inmediato,
    // sin esperar a que termine la animación de transición ni a que el
    // evento NavigationEnd se procese (que puede llegar fuera de NgZone).
    this.currentRoute = path;

    await this.pageTransition.navigateWithTransition(path);

    // Una vez confirmada la navegación, sincronizamos con la URL real del
    // navegador (por si hubo un redirect o la navegación fue cancelada
    // por un guard, dejando el estado optimista desalineado).
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
    if (lang === this.translation.currentLanguage) return;

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
    return this.translation.currentLanguage === 'es' ? 'ES' : 'EN';
  }
}