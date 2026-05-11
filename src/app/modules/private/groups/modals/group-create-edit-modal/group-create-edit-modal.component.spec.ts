import { TestBed } from '@angular/core/testing';
import { GroupCreateEditModalComponent } from './group-create-edit-modal.component';

describe('GroupCreateEditModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupCreateEditModalComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(GroupCreateEditModalComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
