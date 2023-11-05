import { CommonModule } from '@angular/common';
import { Component, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { User } from 'src/app/core/models/user.model';
import { userStore } from 'src/app/core/stores/user.store';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  public user: Signal<User | null | undefined>;

  constructor(private router: Router) {
    this.user = toSignal(userStore.user);
  }

  signOut() {
    userStore.setUser({} as User);
    localStorage.removeItem(environment.accessToken);

    this.router.navigate(['/sign-in']);
  }
}
