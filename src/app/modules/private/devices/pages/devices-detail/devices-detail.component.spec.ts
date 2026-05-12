import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DevicesDetailComponent } from './devices-detail.component';

describe('DevicesDetailComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevicesDetailComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DevicesDetailComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
