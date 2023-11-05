import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css'],
})
export class SignUpComponent {
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
    this.service.signUp(this.form.value).subscribe((data) => {
      if (data) {
        this.router.navigate(['/sign-in']);
      }
    });
  }

  get f() {
    return this.form.controls;
  }
}
