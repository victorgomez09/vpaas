import { Component, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Database } from 'src/app/core/models/database.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-database',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './database.component.html',
  styleUrls: ['./database.component.css'],
})
export class DatabaseComponent {
  public databases!: Signal<Database>;
}
