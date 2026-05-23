import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { toast } from 'ngx-sonner';
import { ThemeService, Theme } from '../../../core/services/theme.service';

@Component({
  selector: 'app-private-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivateLayoutComponent {
  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);

  isSidebarOpen = true;

  get currentTheme(): Theme { return this.themeService.currentTheme(); }
  get user() { return this.authService.currentUser(); }

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
      },
    );
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  changeTheme(theme: 'light' | 'dark' | 'infragest'): void {
    this.themeService.changeTheme(theme);
  }

  getUserInitial(): string {
    const user = this.user;
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  }

  getUserDisplayName(): string {
    const user = this.user;
    return user?.name || user?.username || user?.email || 'Usuario';
  }

  getUserEmail(): string {
    return this.user?.email || '';
  }
}
