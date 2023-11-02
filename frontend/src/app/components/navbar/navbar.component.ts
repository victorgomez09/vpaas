import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { User } from 'src/app/core/models/user.model';
import { userStore } from 'src/app/core/stores/user.store';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {

  public user: Observable<User | null>;

  constructor() {
    this.user = userStore.user;
  }
}
