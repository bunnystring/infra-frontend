import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';

@Component({
  imports: [RouterModule, NgxSonnerToaster],
  selector: 'app-root',
  template: `
    <ngx-sonner-toaster
      position="top-right"
      [richColors]="true"
      [closeButton]="true"
      [duration]="4000" />
    <router-outlet />
  `,
  styleUrls: ['./app.component.css'],
  standalone: true
})
export class AppComponent {}
