import { TestBed } from '@angular/core/testing';
import { GroupsComponent } from './groups.component';

describe('GroupsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupsComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(GroupsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
