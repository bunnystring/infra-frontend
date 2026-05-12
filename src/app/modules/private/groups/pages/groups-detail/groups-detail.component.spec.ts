import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { GroupsDetailComponent } from './groups-detail.component';

describe('GroupsDetailComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupsDetailComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(GroupsDetailComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
