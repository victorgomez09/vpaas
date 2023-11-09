import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  AvailableDatabase,
  Database,
  DatabaseSecrets,
} from '../models/database.model';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private http = inject(HttpClient);

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

  getDatabaseBackup(id: string): void {
    this.http
      .get<{ fileName: string; stream: Blob }>(
        `${environment.apiUrl}/databases/${id}/backup`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem(
              environment.accessToken
            )}`,
            'Content-Type': 'application/octet-stream',
            responseType: 'blob',
          },
        }
      )
      .subscribe((response: { fileName: string; stream: Blob }) => {
        let binaryData = [];
        binaryData.push(response.stream);
        let downloadLink = document.createElement('a');
        downloadLink.href = window.URL.createObjectURL(
          new Blob(binaryData, { type: 'blob' })
        );
        downloadLink.setAttribute('download', response.fileName);
        document.body.appendChild(downloadLink);
        downloadLink.click();
      });
  }

  getDatabaseUsage(id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/databases/${id}/usage`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem(
          environment.accessToken
        )}`,
      },
    });
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

  deleteDatabase(id: string): Observable<Database> {
    return this.http.delete<Database>(`${environment.apiUrl}/databases/${id}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem(
          environment.accessToken
        )}`,
      },
    });
  }
}
