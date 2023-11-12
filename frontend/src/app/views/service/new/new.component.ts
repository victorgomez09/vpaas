import { Component, Injector, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

import { ServiceService } from 'src/app/core/services/service.service';
import { Service } from 'src/app/core/models/service.model';
import { DestinationService } from 'src/app/core/services/destination.service';
import { Destination } from 'src/app/core/models/destination.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './new.component.html',
  styleUrl: './new.component.css',
})
export class NewComponent {
  public availableTemplates!: Signal<any[]>;
  public destinations!: Signal<Destination[]>;
  public selectedTemplate!: any;

  private exposePort: number;

  constructor(
    private service: ServiceService,
    private destinationService: DestinationService,
    private injector: Injector,
    private router: Router
  ) {
    this.exposePort = 12345;
  }

  ngOnInit(): void {
    this.availableTemplates = toSignal(this.service.getAvailableServices(), {
      initialValue: [],
      injector: this.injector,
    });

    this.destinations = toSignal(this.destinationService.getAllDestinations(), {
      initialValue: [],
      injector: this.injector,
    });
  }

  selectService(data: any) {
    this.selectedTemplate = data;
    window.HSTabs.open(document.getElementById('select-destination-id'));
  }

  getServiceSvg(type: string) {
    return type.split('-')[0];
  }

  // sortMe(data: any[]) {
  //   return data.sort((a, b) => {
  //     let fa = a.name.toLowerCase(),
  //       fb = b.name.toLowerCase();
  //     console.log('fa', fa);
  //     console.log('fb', fb);

  //     if (fa < fb) {
  //       return -1;
  //     }
  //     if (fa > fb) {
  //       return 1;
  //     }
  //     return 0;
  //   });
  // }

  selectDestination(destination: Destination) {
    const service: Service = {
      type: this.selectedTemplate.type,
      exposePort: this.exposePort,
      destinationDockerId: destination.id,
    };

    this.service.createService(service).subscribe((data) => {
      this.router.navigate(['/services', data.id]);
    });
  }
}
