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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
