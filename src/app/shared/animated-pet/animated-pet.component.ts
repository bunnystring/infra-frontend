import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { skip } from 'rxjs';

@Component({
  selector: 'app-animated-pet',
  standalone: true,
  imports: [NgClass],
  templateUrl: './animated-pet.component.html',
  styleUrls: ['./animated-pet.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimatedPetComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);

  readonly isPasswordFocused = input(false);
  readonly isTextFieldFocused = input(false);
  readonly textFieldValue = input('');
  readonly focusedFieldType = input<'name' | 'email' | 'username' | 'text' | null>(null);

  readonly eyePositionX = signal(0);
  readonly eyePositionY = signal(0);
  readonly isBlinking = signal(false);

  private blinkInterval: ReturnType<typeof setInterval> | undefined;
  private lastTextLength = 0;

  constructor() {
    toObservable(this.isPasswordFocused)
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((focused) => {
        if (focused) this.lookCenter();
      });

    toObservable(this.isTextFieldFocused)
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((focused) => {
        if (focused) {
          this.lookDown();
        } else if (!this.isPasswordFocused()) {
          this.lookCenter();
        }
      });

    toObservable(this.textFieldValue)
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isTextFieldFocused() && !this.isPasswordFocused()) {
          this.handleTyping();
        }
      });
  }

  ngOnInit(): void {
    this.startRandomBlinking();
  }

  private handleTyping(): void {
    const currentLength = this.textFieldValue()?.length || 0;
    if (currentLength > this.lastTextLength) {
      this.lookRightDown();
      setTimeout(() => {
        if (this.isTextFieldFocused()) this.lookDown();
      }, 150);
    } else if (currentLength < this.lastTextLength) {
      this.lookLeftDown();
      setTimeout(() => {
        if (this.isTextFieldFocused()) this.lookDown();
      }, 150);
    }
    this.lastTextLength = currentLength;
  }

  private lookDown(): void {
    this.eyePositionX.set(0);
    this.eyePositionY.set(15);
  }

  private lookRightDown(): void {
    this.eyePositionX.set(10);
    this.eyePositionY.set(15);
  }

  private lookCenter(): void {
    this.eyePositionX.set(0);
    this.eyePositionY.set(0);
  }

  private lookLeftDown(): void {
    this.eyePositionX.set(-10);
    this.eyePositionY.set(15);
  }

  private startRandomBlinking(): void {
    this.blinkInterval = setInterval(() => {
      if (!this.isPasswordFocused() && !this.isBlinking()) {
        this.blink();
      }
    }, this.getRandomBlinkDelay());
  }

  private getRandomBlinkDelay(): number {
    return Math.random() * 2000 + 3000;
  }

  private blink(): void {
    this.isBlinking.set(true);
    setTimeout(() => {
      this.isBlinking.set(false);
    }, 150);
  }

  resetEyePosition(): void {
    this.eyePositionX.set(0);
    this.eyePositionY.set(0);
    this.lastTextLength = 0;
  }

  ngOnDestroy(): void {
    if (this.blinkInterval) clearInterval(this.blinkInterval);
  }
}
