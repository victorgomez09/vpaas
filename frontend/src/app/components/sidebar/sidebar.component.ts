import { Component, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from 'src/app/core/models/user.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { userStore } from 'src/app/core/stores/user.store';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  public user: Signal<User | null | undefined>;

  constructor() {
    this.user = toSignal(userStore.user);
  }
}
