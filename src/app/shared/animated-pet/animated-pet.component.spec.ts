/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AnimatedPetComponent } from './animated-pet.component';

describe('AnimatedPetComponent', () => {
  let component: AnimatedPetComponent;
  let fixture: ComponentFixture<AnimatedPetComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [ AnimatedPetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnimatedPetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
