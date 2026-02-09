import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../modules/public/auth/models/user.model';
import { Subject, takeUntil } from 'rxjs';
import { toast } from 'ngx-sonner';

/**
 * Componente de Layout Privado
 * Proporciona la estructura de navegación y layout para las rutas privadas de la aplicación
 *
 * @author Bunnystring
 * @since 2026-02-06
 */
@Component({
  selector: 'app-private-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.css'
})
export class PrivateLayoutComponent {

  user: User | null = null;
  isSidebarOpen = true;
  currentTheme: 'light' | 'dark' | 'infragest' = 'infragest';

  private destroy$ = new Subject<void>();

  /**
   * Constructor del componente PrivateLayout
   * @param authService
   */
  constructor(public authService: AuthService) {

    /**
     * Suscribirse al usuario actual para mantener la información del usuario autenticado en el layout
      * Esto permite mostrar el nombre del usuario, avatar, etc. en la barra de navegación
     */
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  /**
   * Inicialización del componente PrivateLayout
   * Carga el tema guardado en localStorage y se suscribe a los cambios del usuario autenticado
   * Esto asegura que el layout refleje el estado de autenticación y preferencias del usuario al cargar la aplicación
   * @returns void
   */
  ngOnInit(): void {
    this.loadTheme();
    this.subscribeToUser();
  }

  /**
   * Método para cerrar sesión del usuario
   * @returns void
   */
  logout(): void {
    toast.promise(
    new Promise((resolve) => {
      setTimeout(() => {
        this.authService.logout();
        resolve(true);
      }, 500);
    }),
    {
      loading: 'Cerrando sesión...',
      success: '¡Hasta pronto!',
      error: 'Error al cerrar sesión',
    }
  );
  }

  /**
   * Toggle sidebar (responsive) para mostrar u ocultar la barra lateral en dispositivos móviles
   * Esto mejora la experiencia de usuario en pantallas pequeñas al permitir mostrar más contenido
   * o acceder a la navegación según sea necesario
   * @returns void
   */
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  /**
   * Cambiar tema de la aplicación
   * @param theme - El tema a aplicar ('light', 'dark' o 'infragest')
   * @returns void
   */
  changeTheme(theme: 'light' | 'dark' | 'infragest'): void {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  /**
   * Cargar tema guardado en localStorage al iniciar el componente
   * @returns void
   */
  private loadTheme(): void {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'infragest';
    if (savedTheme) {
      this.currentTheme = savedTheme;
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }

  /**
   * Suscribirse al usuario actual
   * @returns void
   */
  private subscribeToUser(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
        console.log('👤 Usuario actual:', user);
      });
  }

  /**
   * Limpieza al destruir el componente
   * @returns void
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Obtener inicial del nombre del usuario para el avatar
   * @returns string
   */
  getUserInitial(): string {
    if (this.user?.name) {
      return this.user.name.charAt(0).toUpperCase();
    }
    if (this.user?.email) {
      return this.user.email.charAt(0).toUpperCase();
    }
    return 'U';
  }

  /**
   * Obtener nombre completo o email del usuario
   * @returns string
   */
  getUserDisplayName(): string {
    return this.user?.name || this.user?.username || this.user?.email || 'Usuario';
  }

  /**
   * Obtener el email del usuario autenticado
   * @returns string
   */
  getUserEmail(): string {
    const user = this.user;
    return user?.email || '';
  }

}
