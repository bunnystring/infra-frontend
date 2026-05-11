import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { Group, GroupFormResult } from '../../models/groups.model';
import { GroupsService } from '../../services/groups.service';
import { noWhitespaceValidator } from '../../../../../core/utils/form-validators.utils';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-group-create-edit-modal',
  templateUrl: './group-create-edit-modal.component.html',
  standalone: true,
  styleUrls: ['./group-create-edit-modal.component.css'],
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupCreateEditModalComponent implements OnInit, OnChanges, OnDestroy {
  @Input() group: Group | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<GroupFormResult>();

  groupForm!: FormGroup;
  submitted = false;
  formError = '';
  formLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private groupsService: GroupsService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['group'] && !changes['group'].firstChange) {
      this.initForm();
    }
  }

  private initForm(): void {
    this.groupForm = this.fb.group({
      name: [
        this.group?.name || '',
        [Validators.required, noWhitespaceValidator()],
      ],
      address: [
        this.group?.address || '',
        [Validators.required, noWhitespaceValidator()],
      ],
    });
    this.submitted = false;
    this.formError = '';
    this.formLoading = false;
  }

  submit(): void {
    this.submitted = true;
    this.formError = '';

    if (this.group && !this.hasChanges()) {
      toast.warning('No se detectaron cambios en el grupo');
      return;
    }

    if (this.groupForm.invalid) return;

    this.formLoading = true;
    this.cd.markForCheck();

    const value = this.groupForm.value;
    const isEdit = !!this.group;
    const op$ = this.group
      ? this.groupsService.updateGroup(this.group.id, value)
      : this.groupsService.createGroup(value);

    op$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.formLoading = false;
          this.cd.markForCheck();
        }),
      )
      .subscribe({
        next: (group: Group) => {
          this.save.emit({ group, mode: isEdit ? 'edit' : 'create' });
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'Error al guardar el grupo';
          this.formError = msg;
          toast.error('Error al guardar el grupo', { description: msg });
        },
      });
  }

  closeModal(): void {
    this.close.emit();
  }

  private hasChanges(): boolean {
    if (!this.group) return true;
    const current = this.groupForm.value;
    return (
      current.name !== this.group.name ||
      current.address !== this.group.address
    );
  }
}
