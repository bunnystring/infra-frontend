import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  Subject,
  Observable,
  of,
  switchMap,
  tap,
  catchError,
  finalize,
  takeUntil,
} from 'rxjs';
import { Group } from '../../models/groups.model';
import { GroupsService } from '../../services/groups.service';
import { LoadingService } from '../../../../../core/services/loading.service';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-groups-detail',
  templateUrl: './groups-detail.component.html',
  styleUrls: ['./groups-detail.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class GroupsDetailComponent implements OnInit, OnDestroy {
  group$: Observable<Group | null> = of(null);

  loading = false;
  error = '';
  removingEmployeeId: string | null = null;

  get loading$() {
    return this.loadingService.loading$;
  }

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private groupsService: GroupsService,
    private location: Location,
    private loadingService: LoadingService,
  ) {}

  ngOnInit(): void {
    this.initParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initParams(): void {
    this.group$ = this.route.params.pipe(
      tap(() => {
        this.loading = true;
        this.error = '';
      }),
      switchMap((params) =>
        this.groupsService.getGroupById(params['id']).pipe(
          catchError((err) => {
            toast.error('Error al cargar el grupo');
            this.error = err?.error?.message || 'Error al cargar el grupo';
            return of(null);
          }),
          finalize(() => (this.loading = false)),
        ),
      ),
      takeUntil(this.destroy$),
    );
  }

  removeEmployee(groupId: string, employeeId: string): void {
    this.removingEmployeeId = employeeId;
    this.groupsService
      .removeEmployeesFromGroup(groupId, employeeId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.removingEmployeeId = null)),
      )
      .subscribe({
        next: () => {
          toast.success('Empleado removido del grupo');
          this.initParams();
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'Error al remover el empleado';
          toast.error('Error al remover empleado', { description: msg });
        },
      });
  }

  refreshData(): void {
    this.initParams();
  }

  goBack(): void {
    this.location.back();
  }

  getShortId(id: string): string {
    return id.substring(0, 8);
  }
}
