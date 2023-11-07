import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  AvailableDatabase,
  Database,
  DatabaseSecrets,
} from '../models/database.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  constructor(private http: HttpClient) {}

  getAllDatabases(): Observable<Database[]> {
    return this.http.get<Database[]>(`${environment.apiUrl}/databases`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem(
          environment.accessToken
        )}`,
      },
    });
  }

  getAvailableDatabases(): Observable<AvailableDatabase[]> {
    return this.http.get<AvailableDatabase[]>(
      `${environment.apiUrl}/databases/available/list`,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem(
            environment.accessToken
          )}`,
        },
      }
    );
  }

  getAvailableDatabaseByName(name: string): Observable<AvailableDatabase> {
    return this.http.get<AvailableDatabase>(
      `${environment.apiUrl}/databases/available/${name}`,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem(
            environment.accessToken
          )}`,
        },
      }
    );
  }

  getDatabaseById(id: string): Observable<Database> {
    return this.http.get<Database>(`${environment.apiUrl}/databases/${id}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem(
          environment.accessToken
        )}`,
      },
    });
  }

  getDatabaseSecretsById(id: string): Observable<DatabaseSecrets[]> {
    return this.http.get<DatabaseSecrets[]>(
      `${environment.apiUrl}/databases/${id}/secrets`,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem(
            environment.accessToken
          )}`,
        },
      }
    );
  }

  getDatabaseStatus(id: string): Observable<{ isRunning: true }> {
    return this.http.get<{ isRunning: true }>(
      `${environment.apiUrl}/databases/${id}/status`,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem(
            environment.accessToken
          )}`,
        },
      }
    );
  }

  getDatabaseLogs(id: string): Observable<{ logs: string[] }> {
    return this.http.get<{ logs: string[] }>(
      `${environment.apiUrl}/databases/${id}/logs`,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem(
            environment.accessToken
          )}`,
        },
      }
    );
  }

  getDatabaseImage(name: string, version: string): Observable<void> {
    return this.http.get<void>(
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

  startDatabase(id: string): Observable<Database> {
    return this.http.post<Database>(
      `${environment.apiUrl}/databases/${id}/start`,
      null,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem(
            environment.accessToken
          )}`,
        },
      }
    );
  }

  stopDatabase(id: string): Observable<Database> {
    return this.http.post<Database>(
      `${environment.apiUrl}/databases/${id}/stop`,
      null,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem(
            environment.accessToken
          )}`,
        },
      }
    );
  }
}
