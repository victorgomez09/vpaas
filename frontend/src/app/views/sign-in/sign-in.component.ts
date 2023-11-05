import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { environment } from 'src/environments/environment';
import { userStore } from 'src/app/core/stores/user.store';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
})
export class SignInComponent {
  public form: FormGroup;

  private fb: FormBuilder = inject(FormBuilder);
  private router: Router = inject(Router);
  private service: AuthService = inject(AuthService);

  constructor() {
    this.form = this.fb.group({
      email: ['', [Validators.email, Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  handleSubmit() {
    this.service.signIn(this.form.value).subscribe((data) => {
      sessionStorage.setItem(environment.accessToken, data.token);
      userStore.setUser(data.user);
      this.router.navigate(['/']);
    });
  }

  get f() {
    return this.form.controls;
  }
}
