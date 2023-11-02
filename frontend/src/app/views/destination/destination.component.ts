import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { DestinationService } from 'src/app/core/services/destination.service';
import { Destination } from 'src/app/core/models/destination.model';

@Component({
  selector: 'app-destination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './destination.component.html',
  styleUrls: ['./destination.component.css']
})
export class DestinationComponent {
  public destinations: Observable<Destination[]>

  private service: DestinationService = inject(DestinationService);

  constructor() {
    this.destinations = this.service.getAllDestinations();
  }
}
