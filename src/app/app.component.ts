import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgxSonnerToaster],
  template: `
    <ngx-sonner-toaster
      position="top-right"
      [richColors]="true"
      [closeButton]="true"
      [duration]="4000" />
    <router-outlet />
  `,
  standalone: true,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'infragest-frontend';
}
