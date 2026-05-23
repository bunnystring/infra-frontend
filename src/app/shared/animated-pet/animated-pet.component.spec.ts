import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnimatedPetComponent } from './animated-pet.component';

describe('AnimatedPetComponent', () => {
  let component: AnimatedPetComponent;
  let fixture: ComponentFixture<AnimatedPetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnimatedPetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AnimatedPetComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => TestBed.resetTestingModule());

  // ── Creación ──────────────────────────────────────────────────────────────
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Estado inicial de signals ─────────────────────────────────────────────
  describe('estado inicial', () => {
    it('eyePositionX inicia en 0', () => {
      expect(component.eyePositionX()).toBe(0);
    });

    it('eyePositionY inicia en 0', () => {
      expect(component.eyePositionY()).toBe(0);
    });

    it('isBlinking inicia en false', () => {
      expect(component.isBlinking()).toBe(false);
    });
  });

  // ── resetEyePosition ─────────────────────────────────────────────────────
  describe('resetEyePosition', () => {
    it('restaura eyePositionX a 0', () => {
      component.eyePositionX.set(10);
      component.resetEyePosition();
      expect(component.eyePositionX()).toBe(0);
    });

    it('restaura eyePositionY a 0', () => {
      component.eyePositionY.set(15);
      component.resetEyePosition();
      expect(component.eyePositionY()).toBe(0);
    });
  });

  // ── ngOnDestroy ───────────────────────────────────────────────────────────
  describe('ngOnDestroy', () => {
    it('limpia el intervalo de parpadeo sin lanzar error', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
