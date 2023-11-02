import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { User } from '../models/user.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private http: HttpClient = inject(HttpClient);

  getMe() {
    return this.http.post<User>(`${environment.apiUrl}/users/getMe`, null, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem(environment.accessToken)}`
      }
    });
  }
}
