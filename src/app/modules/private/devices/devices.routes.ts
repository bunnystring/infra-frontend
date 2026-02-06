import { Routes, RouterModule } from '@angular/router';
import { DevicesComponent } from './pages/devices/devices.component';

export const DEVICES_ROUTES: Routes = [
  {
  path: '',
  component: DevicesComponent,
  data: { breadcrumb: 'Devices' }
   },
];

