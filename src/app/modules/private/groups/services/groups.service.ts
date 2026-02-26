import { Injectable } from '@angular/core';
import { LoadingService } from '../../../../core/services/loading.service';
import { ApiService } from '../../../../core/services/api.service';
import { inject } from '@angular/core';

/**
 * Servicio para gestionar grupos
 *
 * @since 2026-02-24
 * @author Bunnystring
 */
@Injectable({
  providedIn: 'root'
})
export class GroupsService {

 private loading = inject(LoadingService);

  // Injected services
  private apiService = inject(ApiService);


  createGroup

}
