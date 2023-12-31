import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { SignIn, SignInResponse, SignUp } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http: HttpClient = inject(HttpClient);

  signIn(data: SignIn) {
    return this.http.post<SignInResponse>(
      `${environment.apiUrl}/auth/signin`,
      data
    );
  }

  signUp(data: SignUp) {
    return this.http.post<SignInResponse>(
      `${environment.apiUrl}/auth/signUp`,
      data
    );
  }
}
