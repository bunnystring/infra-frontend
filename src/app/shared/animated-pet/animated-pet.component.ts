import { CommonModule } from '@angular/common';
import {
  Component,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Input } from '@angular/core';

/**
 * Componente de Mascota Animada
 * Mascota interactiva que sigue el cursor en el email y se tapa los ojos en el password
 *
 * @author Bunnystring
 * @since 2026-02-10
 */
@Component({
  selector: 'app-animated-pet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './animated-pet.component.html',
  styleUrls: ['./animated-pet.component.css'],
})
export class AnimatedPetComponent implements OnInit, OnDestroy, OnChanges {

  // Inputs para controlar el estado de la mascota desde el componente padre (LoginComponent)
  @Input() isPasswordFocused = false;
  @Input() isTextFieldFocused = false;
  @Input() textFieldValue = '';
  @Input() focusedFieldType: 'name' | 'email' | 'username' | 'text' | null =
    null;

  // Posición de los ojos
  eyePositionX = 0;
  eyePositionY = 0;
  isBlinking = false;

  // Control de parpadeo
  private blinkInterval: any;
  private lastTextLength = 0;

  constructor() {}

  /**
   * Inicialización del componente
   * Inicia el parpadeo aleatorio de la mascota
   * @returns void
   */
  ngOnInit(): void {
    this.startRandomBlinking();
  }

  /**
   * Detectar cambios en los inputs
   * Cuando el usuario escribe, los ojos se mueven
   * @returns void
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Cuando el email recibe focus, ojos miran hacia abajo
    if (changes['isPasswordFocused'] && this.isPasswordFocused) {
      this.lookCenter();
      return;
    }

    // Cuando el campo de texto recibe focus, ojos miran hacia abajo
    if (changes['isTextFieldFocused']) {
      if (this.isTextFieldFocused) {
        this.lookDown();
      } else if (!this.isPasswordFocused) {
        this.lookCenter();
      }
    }

    // Cuando el usuario escribe en el campo de texto, los ojos siguen el ritmo de escritura
    if (
      changes['textFieldValue'] &&
      this.isTextFieldFocused &&
      !this.isPasswordFocused
    ) {
      this.handleTyping();
    }
  }

  /**
   * Manejar la lógica de movimiento de ojos al escribir o borrar en el campo de texto
   * @returns void
   */
  private handleTyping(): void {
    const currentLength = this.textFieldValue?.length || 0;

    // Si se está escribiendo (texto aumenta)
    if (currentLength > this.lastTextLength) {
      this.lookRightDown();

      // Volver al centro después de 150ms PERO MANTENER ABAJO
      setTimeout(() => {
        if (this.isTextFieldFocused) {
          this.lookDown();
        }
      }, 150);
    }
    // Si se está borrando (texto disminuye)
    else if (currentLength < this.lastTextLength) {
      this.lookLeftDown();

      setTimeout(() => {
        if (this.isTextFieldFocused) {
          this.lookDown();
        }
      }, 150);
    }

    this.lastTextLength = currentLength;
  }

  /**
   * Mirar hacia abajo (campo de texto enfocado)
   * @returns void
   */
  private lookDown(): void {
    this.eyePositionX = 0;
    this.eyePositionY = 15;
  }

  /**
   * Mirar derecha-abajo (escribiendo)
   * @returns void
   */
  private lookRightDown(): void {
    this.eyePositionX = 10;
    this.eyePositionY = 15;
  }

  /**
   * Mirar al centro (sin focus)
   * @returns void
   */
  private lookCenter(): void {
    this.eyePositionX = 0;
    this.eyePositionY = 0;
  }

  /**
   * Mirar izquierda-abajo (borrando)
   * @returns void
   */
  private lookLeftDown(): void {
    this.eyePositionX = -10;
    this.eyePositionY = 15;
  }

  /**
   * Iniciar parpadeo aleatorio cada 3-5 segundos
   * El parpadeo solo ocurre si el campo de password no está enfocado y la mascota no está actualmente parpadeando
   * Esto añade un toque de vida a la mascota sin ser molesto para el usuario
   * @returns void
   */
  private startRandomBlinking(): void {
    this.blinkInterval = setInterval(() => {
      if (!this.isPasswordFocused && !this.isBlinking) {
        this.blink();
      }
    }, this.getRandomBlinkDelay());
  }

  /**
   * Obtener delay aleatorio para parpadeo (3000-5000ms)
   * Esto hace que el parpadeo sea impredecible y más natural, evitando patrones repetitivos que podrían resultar molestos
   * @returns número aleatorio entre 3000 y 5000
   */
  private getRandomBlinkDelay(): number {
    return Math.random() * 2000 + 3000;
  }

  /**
   * Ejecutar animación de parpadeo durante 150ms
   * Durante el parpadeo, se establece isBlinking en true para evitar que se inicie otro parpadeo hasta que termine el actual
   * Esto asegura que la mascota no intente parpadear varias veces al mismo tiempo, lo que podría causar un efecto visual extraño
   * @returns void
   */
  private blink(): void {
    this.isBlinking = true;
    setTimeout(() => {
      this.isBlinking = false;
    }, 150);
  }

  /**
   * Resetear posición de ojos al centro cuando el cursor sale del input
   * Esto asegura que la mascota vuelva a una posición neutral cuando el usuario no está interactuando con el campo de email
   * @returns void
   */
  resetEyePosition(): void {
    this.eyePositionX = 0;
    this.eyePositionY = 0;
    this.lastTextLength = 0;
  }

  /**
   * Limpieza al destruir el componente
   * Limpia el interval de parpadeo para evitar memory leaks
   * @returns void
   */
  ngOnDestroy(): void {
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
    }
  }
}
