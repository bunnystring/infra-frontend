import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Group } from '../../models/groups.model';
import { GroupsService } from '../../services/groups.service';
import { toast } from 'ngx-sonner';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-group-delete-modal',
  templateUrl: './group-delete-modal.component.html',
  styleUrls: ['./group-delete-modal.component.css'],
  standalone: true,
  imports: [],
})
export class GroupDeleteModalComponent implements OnInit {
  @Input() group: Group | null = null;
  @Output() deleted = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  loading = false;
  error = '';

  constructor(private groupsService: GroupsService) {}

  ngOnInit(): void {}

  confirmDelete(): void {
    if (!this.group) return;
    this.loading = true;
    this.groupsService
      .deleteGroupById(this.group.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          toast.success('Grupo eliminado');
          this.deleted.emit();
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'Error al eliminar el grupo';
          this.error = msg;
          toast.error('Error al eliminar el grupo', { description: msg });
        },
      });
  }

  cancelDelete(): void {
    this.cancel.emit();
  }
}
