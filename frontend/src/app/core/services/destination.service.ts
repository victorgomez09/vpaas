import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { Destination } from '../models/destination.model';

@Injectable({
  providedIn: 'root'
})
export class DestinationService {

  private http: HttpClient = inject(HttpClient)

  getAllDestinations(): Observable<Destination[]> {
    return this.http.get<Destination[]>(`${environment.apiUrl}/destinations`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem(environment.accessToken)}`
      }
    });
  }

  getDestinationById(id: string): Observable<Destination> {
    return this.http.get<Destination>(`${environment.apiUrl}/destinations/${id}`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem(environment.accessToken)}`
      }
    });
  }

  updateDestination(id: string, data: Destination): Observable<Destination> {
    return this.http.put<Destination>(`${environment.apiUrl}/destinations/${id}`, data, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem(environment.accessToken)}`
      },
    });
  }

  updateDestinationProxy(id: string, data: boolean): Observable<Destination> {
    return this.http.put<Destination>(`${environment.apiUrl}/destinations/proxy/${id}`, {
      proxy: data
    }, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem(environment.accessToken)}`
      },
    });
  }

  updateDestinationProxyForce(id: string): Observable<Destination> {
    return this.http.put<Destination>(`${environment.apiUrl}/destinations/proxy/force/${id}`, null, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem(environment.accessToken)}`
      },
    });
  }

  deleteDestination(id: string): Observable<Destination> {
    return this.http.delete<Destination>(`${environment.apiUrl}/destinations/${id}`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem(environment.accessToken)}`
      },
    });
  }
}
