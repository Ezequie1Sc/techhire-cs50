import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import gsap from 'gsap';

@Injectable({
  providedIn: 'root'
})
export class PageTransitionService {
  private isRunning = false;

  // IMPORTANTE: Inyectar Router para navegar correctamente
  constructor(private router: Router) {}

  async reloadWithTransition(action: () => void): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const page = document.querySelector('.page-transition-wrapper');

      if (!page) {
        action();
        location.reload();
        return;
      }

      await gsap.to(page, {
        opacity: 0,
        scale: 0.985,
        y: 14,
        filter: 'blur(18px)',
        duration: 0.45,
        ease: 'power3.inOut'
      });

      sessionStorage.setItem('joblyPageTransition', 'true');

      action();

      setTimeout(() => {
        location.reload();
      }, 80);
    } catch (error) {
      // Si algo falla (p. ej. GSAP anima un nodo ya desmontado), no
      // dejamos la promesa colgada: forzamos el reload igualmente para
      // no dejar al usuario atascado en una animación fallida.
      console.error('reloadWithTransition error:', error);
      location.reload();
    } finally {
      // CRÍTICO: isRunning es un flag de un servicio singleton (root),
      // compartido por TODA la app (navbar, home, etc.). Si no se
      // resetea aquí ante un error, cualquier botón que dependa de este
      // servicio deja de responder para siempre, en toda la aplicación.
      this.isRunning = false;
    }
  }

  playEnterTransition(): void {
    const shouldAnimate = sessionStorage.getItem('joblyPageTransition');

    if (!shouldAnimate) return;

    sessionStorage.removeItem('joblyPageTransition');

    const page = document.querySelector('.page-transition-wrapper');

    if (!page) return;

    gsap.set(page, {
      opacity: 0,
      scale: 1.015,
      y: -10,
      filter: 'blur(18px)'
    });

    gsap.to(page, {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.75,
      ease: 'power4.out',
      delay: 0.1
    });
  }

  async navigateWithTransition(path: string): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const page = document.querySelector('.page-transition-wrapper');

      if (!page) {
        // Fallback: navegación directa con Angular Router (usando navigateByUrl)
        await this.router.navigateByUrl(path);
        return;
      }

      // 1. Animación de salida
      await gsap.to(page, {
        opacity: 0,
        scale: 0.985,
        y: 14,
        filter: 'blur(18px)',
        duration: 0.42,
        ease: 'power3.inOut'
      });

      // 2. Navegación con Angular Router (CORRECCIÓN CLAVE)
      // Usamos navigateByUrl para rutas absolutas y evitar errores de contexto
      const navigationSucceeded = await this.router.navigateByUrl(path);

      // Si un guard canceló la navegación (devuelve false), restauramos
      // la vista anterior en vez de animar como si hubiéramos llegado
      // a una página nueva. Esto evita que el navbar y el contenido
      // queden desincronizados visualmente.
      if (!navigationSucceeded) {
        await gsap.to(page, {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.42,
          ease: 'power3.inOut'
        });

        return;
      }

      // 3. Scroll al inicio
      window.scrollTo({ top: 0, behavior: 'auto' });

      // 4. Preparar la animación de entrada
      gsap.set(page, {
        opacity: 0,
        scale: 1.015,
        y: -10,
        filter: 'blur(18px)'
      });

      // 5. Animación de entrada
      await gsap.to(page, {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.7,
        ease: 'power4.out'
      });
    } catch (error) {
      // Si la animación o la navegación fallan (p. ej. el nodo
      // .page-transition-wrapper fue destruido por Angular al cambiar
      // de ruta, o router.navigateByUrl() rechaza), intentamos igual navegar
      // por la vía directa para no dejar al usuario varado en la ruta
      // anterior con la pantalla a medio desvanecer.
      console.error('navigateWithTransition error:', error);
      try {
        // Fallback con navigateByUrl
        await this.router.navigateByUrl(path);
      } catch {
        // Si incluso la navegación directa falla, no hay más que hacer
        // aquí; el error ya quedó logueado arriba.
      }
    } finally {
      // CRÍTICO: mismo motivo que en reloadWithTransition — sin este
      // reset garantizado, un solo error deja bloqueados todos los
      // botones de navegación de la app (navbar, Home, etc.) porque
      // isRunning nunca vuelve a false.
      this.isRunning = false;
    }
  }
}