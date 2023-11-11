import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Service } from '../models/service.model';
import { Settings } from '../models/settings.model';

@Injectable({
  providedIn: 'root',
})
export class ServiceService {
  constructor(private http: HttpClient) {}

  getAvailableServices(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/services/available`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem(
          environment.accessToken
        )}`,
      },
    });
  }

  getAllServices(): Observable<Service[]> {
    return this.http.get<Service[]>(`${environment.apiUrl}/services/list`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem(
          environment.accessToken
        )}`,
      },
    });
  }

  getServiceById(id: string): Observable<{
    service: Service;
    settings: Settings;
    tags: any;
    template: any;
  }> {
    return this.http.get<{
      service: Service;
      settings: Settings;
      tags: any;
      template: any;
    }>(`${environment.apiUrl}/services/${id}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem(
          environment.accessToken
        )}`,
      },
    });
  }

  getServiceStatusById(id: string): Observable<{
    service: Service;
    settings: Settings;
    tags: any;
    template: any;
  }> {
    return this.http.get<{
      service: Service;
      settings: Settings;
      tags: any;
      template: any;
    }>(`${environment.apiUrl}/services/${id}/status`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem(
          environment.accessToken
        )}`,
      },
    });
  }

  createService(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/services/create`, data, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem(
          environment.accessToken
        )}`,
      },
    });
  }
}
