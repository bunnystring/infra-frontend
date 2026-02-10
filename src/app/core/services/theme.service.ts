import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark' | 'infragest';

/**
 * Servicio para gestionar el tema de la aplicación
 *
 * @since 2026-02-05
 * @author Bunnystring
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'theme';
  private readonly DEFAULT_THEME: Theme = 'infragest';

  private currentThemeSubject = new BehaviorSubject<Theme>('infragest');
  public currentTheme$ = this.currentThemeSubject.asObservable();

  /**
   * Constructor del servicio ThemeService
   * @params none
   */
  constructor() {
    this.initializeTheme();
  }

  /**
   * Cargar tema guardado en localStorage o aplicar tema por defecto
   * @return void
   */
  private initializeTheme(): void {
    const savedTheme = this.getSavedTheme();
    this.applyTheme(savedTheme);
  }

  /**
   * Obtener tema guardado en localStorage o retornar el tema por defecto si no hay ninguno guardado
   * @return Theme - El tema guardado o el tema por defecto
   */
  private getSavedTheme(): Theme {
    const saved = localStorage.getItem(this.THEME_KEY) as Theme;
    return saved || this.DEFAULT_THEME;
  }

  /**
   * Cambiar y aplicar tema seleccionado por el usuario
   * @param theme - El tema a aplicar ('light', 'dark' o 'infragest')
   * @return void
   */
  changeTheme(theme: Theme): void {
    this.applyTheme(theme);
    localStorage.setItem(this.THEME_KEY, theme);
  }

  /**
   * Aplicar tema al documento y actualizar el estado del tema actual
   * @param theme - El tema a aplicar
   * @return void
   */
  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
    this.currentThemeSubject.next(theme);
  }

  /**
   * Obtener tema actual para mostrar en el UI o para lógica condicional
   * @return Theme - El tema actual
   */
  getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  /**
   * Alternar entre temas en orden: light -> dark -> infragest -> light
   * Este método puede ser llamado desde un botón de toggle en la UI para cambiar rápidamente el tema
   * @return void
   */
  toggleTheme(): void {
    const themes: Theme[] = ['light', 'dark', 'infragest'];
    const current = this.getCurrentTheme();
    const currentIndex = themes.indexOf(current);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.changeTheme(themes[nextIndex]);
  }

}
