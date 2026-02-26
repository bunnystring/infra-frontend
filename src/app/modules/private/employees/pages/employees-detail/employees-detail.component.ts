import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employees-detail',
  templateUrl: './employees-detail.component.html',
  styleUrls: ['./employees-detail.component.css'],
})
export class EmployeesDetailComponent implements OnInit {
  constructor(private location: Location) {}

  ngOnInit() {}

  /**
   * Navega a la página anterior utilizando el servicio Location de Angular
   * Permite al usuario volver a la lista de dispositivos o a la página desde donde accedió al detalle del dispositivo
   * @returns void
   */
  goBack(): void {
    this.location.back();
  }
}
