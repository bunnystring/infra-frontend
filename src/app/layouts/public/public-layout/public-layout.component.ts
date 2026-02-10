import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

/**
 * Componente de Layout Público
 * Proporciona la estructura de navegación y layout para las rutas públicas de la aplicación
 *
 * @author Bunnystring
 * @since 2026-02-06
 */
@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.css'
})
export class PublicLayoutComponent {

  // Año actual para mostrar en el footer
  currentYear = new Date().getFullYear();

  constructor(
    private themeService: ThemeService
  ) {
  }
}
