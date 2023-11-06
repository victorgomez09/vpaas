import { Component, OnInit, Signal, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { User } from 'src/app/core/models/user.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { userStore } from 'src/app/core/stores/user.store';
import { filter } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit {
  public user: Signal<User | null | undefined>;
  public currentPath: WritableSignal<string>;

  constructor(private router: Router) {
    this.user = toSignal(userStore.user);
    this.currentPath = signal("");
  }

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    )
      .subscribe(event => {
        this.currentPath.set((event as NavigationEnd).url.split('/')[1].charAt(0).toUpperCase() + (event as NavigationEnd).url.split('/')[1].slice(1))
      });
  }
}
