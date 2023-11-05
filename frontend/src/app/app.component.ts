import { CommonModule } from '@angular/common';
import { Component, Injector, OnInit, Signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import 'preline';

import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { User } from './core/models/user.model';
import { userStore } from './core/stores/user.store';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  public title = 'v-paas';
  public user!: Signal<User | null | undefined>;

  constructor(private injector: Injector) {}

  ngOnInit(): void {
    this.user = toSignal(userStore.user, {
      injector: this.injector,
    });
  }
}
