import { Component, Injector, OnInit, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Database } from 'src/app/core/models/database.model';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-database',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './database.component.html',
  styleUrls: ['./database.component.css'],
})
export class DatabaseComponent implements OnInit {
  public databases!: Signal<Database[]>;

  constructor(private service: DatabaseService, private injector: Injector) {}

  ngOnInit(): void {
    this.databases = toSignal(this.service.getAllDatabases(), {
      initialValue: [],
      injector: this.injector,
    });
  }
}
