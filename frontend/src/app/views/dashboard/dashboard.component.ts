import { CommonModule } from '@angular/common';
import { Component, Injector, OnInit, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';

import { Destination } from 'src/app/core/models/destination.model';
import { DestinationService } from 'src/app/core/services/destination.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  public destinations: Signal<Destination[]>;

  constructor(
    private destinationService: DestinationService,
    private injector: Injector
  ) {
    this.destinations = signal([]);
  }

  ngOnInit(): void {
    this.destinations = toSignal(this.destinationService.getAllDestinations(), {
      initialValue: [],
      injector: this.injector,
    });
  }
}
