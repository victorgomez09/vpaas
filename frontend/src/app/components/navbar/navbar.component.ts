import { CommonModule } from '@angular/common';
import { Component, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { User } from 'src/app/core/models/user.model';
import { userStore } from 'src/app/core/stores/user.store';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {

  public user: Signal<User | null | undefined>;

  constructor() {
    this.user = toSignal(userStore.user);
  }
}
