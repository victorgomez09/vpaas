import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AvailableDatabase, Database } from '../models/database.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  constructor(private http: HttpClient) {}

  getAvailableDatabases(): Observable<AvailableDatabase[]> {
    return this.http.get<AvailableDatabase[]>(
      `${environment.apiUrl}/databases/available`,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem(
            environment.accessToken
          )}`,
        },
      }
    );
  }

  getDatabaseImage(name: string, version: string): Observable<any> {
    return this.http.get<AvailableDatabase[]>(
      `${environment.apiUrl}/databases/available/${name}/version/${version}`,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem(
            environment.accessToken
          )}`,
        },
      }
    );
  }

  create(data: Database): Observable<Database> {
    return this.http.post<Database>(`${environment.apiUrl}/databases`, data, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem(
          environment.accessToken
        )}`,
      },
    });
  }
}
