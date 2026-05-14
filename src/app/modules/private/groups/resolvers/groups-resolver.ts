import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs';
import { GroupsStore } from '../store/groups.store';

export const groupsResolver: ResolveFn<boolean> = () =>
  inject(GroupsStore).loadGroups().pipe(map(() => true));
