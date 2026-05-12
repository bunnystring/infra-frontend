import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs';
import { DevicesStore } from '../store/devices.store';

export const devicesResolver: ResolveFn<boolean> = () =>
  inject(DevicesStore).loadDevices().pipe(map(() => true));
