import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { Observable, catchError, of, tap } from 'rxjs';
import { Group } from '../models/groups.model';
import { GroupsService } from '../services/groups.service';

interface GroupsState {
  groups: Group[];
  isLoading: boolean;
  error: string | null;
}

export const GroupsStore = signalStore(
  { providedIn: 'root' },
  withState<GroupsState>({
    groups: [],
    isLoading: false,
    error: null,
  }),
  withComputed(({ groups }) => ({
    stats: computed(() => {
      const list = groups();
      return {
        total: list.length,
        withEmployees: list.filter((g) => g.employees?.length > 0).length,
        empty: list.filter((g) => !g.employees?.length).length,
      };
    }),
  })),
  withMethods((store) => {
    const groupsService = inject(GroupsService);

    return {
      loadGroups(): Observable<Group[]> {
        patchState(store, { isLoading: true, error: null });
        return groupsService.getAllGroups().pipe(
          tap((groups) => patchState(store, { groups, isLoading: false })),
          catchError((err) => {
            patchState(store, { error: 'Error al cargar grupos', isLoading: false });
            return of([]);
          }),
        );
      },

      upsertGroup(group: Group): void {
        patchState(store, (state) => ({
          groups: state.groups.some((g) => g.id === group.id)
            ? state.groups.map((g) => (g.id === group.id ? group : g))
            : [...state.groups, group],
        }));
      },

      removeGroup(id: string): void {
        patchState(store, (state) => ({
          groups: state.groups.filter((g) => g.id !== id),
        }));
      },

      clearError(): void {
        patchState(store, { error: null });
      },
    };
  }),
);
