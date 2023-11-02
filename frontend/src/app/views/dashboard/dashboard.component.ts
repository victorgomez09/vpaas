import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from 'src/app/core/models/user.model';
import { userStore } from 'src/app/core/stores/user.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  public user: Observable<User | null>;

  constructor() {
    this.user = userStore.user;
  }
}
