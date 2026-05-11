import { TestBed } from '@angular/core/testing';
import { GroupDeleteModalComponent } from './group-delete-modal.component';

describe('GroupDeleteModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupDeleteModalComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(GroupDeleteModalComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
