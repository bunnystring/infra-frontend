import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark' | 'infragest';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'theme';
  private readonly DEFAULT_THEME: Theme = 'infragest';
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _currentTheme = signal<Theme>(
    this.isBrowser ? this.getSavedTheme() : this.DEFAULT_THEME,
  );
  readonly currentTheme = this._currentTheme.asReadonly();

  constructor() {
    if (this.isBrowser) {
      document.documentElement.setAttribute('data-theme', this._currentTheme());
    }
  }

  changeTheme(theme: Theme): void {
    if (this.isBrowser) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(this.THEME_KEY, theme);
    }
    this._currentTheme.set(theme);
  }

  getCurrentTheme(): Theme {
    return this._currentTheme();
  }

  toggleTheme(): void {
    const themes: Theme[] = ['light', 'dark', 'infragest'];
    const currentIndex = themes.indexOf(this._currentTheme());
    const nextIndex = (currentIndex + 1) % themes.length;
    this.changeTheme(themes[nextIndex]);
  }

  private getSavedTheme(): Theme {
    const saved = localStorage.getItem(this.THEME_KEY) as Theme;
    return saved || this.DEFAULT_THEME;
  }
}
