import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Destination } from '../models/destination.model';

@Injectable({
  providedIn: 'root'
})
export class DestinationService {

  private http: HttpClient = inject(HttpClient)

  getAllDestinations() {
    return this.http.get<Destination[]>(`${environment.apiUrl}/destinations`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem(environment.accessToken)}`
      }
    })
  }
}
