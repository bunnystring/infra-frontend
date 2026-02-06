import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardStatsDevices } from './models/DashboardStats';
import { RecentOrders } from './models/RecentOrders';
import { DevicesService } from '../devices/services/devices.service';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  // Sample data for demonstration purposes
  statsDevices!: DashboardStatsDevices;
  recentOrders: RecentOrders[] = [];

  constructor(private devicesService: DevicesService) {}

  ngOnInit() {
    this.initParams();
  }

  /**
   * Inicializa los parámetros del dashboard
   */
  initParams() {
    this.getAllDevices();
  }

  /**
   * Obtiene todos los dispositivos y actualiza las estadísticas
   *
   * @Returns <Devices>
   */
  getAllDevices() {
    this.devicesService.getAllDevices().subscribe({
      next: (devices) => {
        if (devices) {
          this.statsDevices = {
            totalDevices: devices.length,
          };
        }
      },
      error: (err) => {
        console.error('Error fetching devices:', err);
      },
    });
  }
}
