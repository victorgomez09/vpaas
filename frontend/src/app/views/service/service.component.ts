import { Component, Injector, OnInit, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ServiceService } from 'src/app/core/services/service.service';
import { Service } from 'src/app/core/models/service.model';

@Component({
  selector: 'app-service',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './service.component.html',
  styleUrl: './service.component.css',
})
export class ServiceComponent implements OnInit {
  public services!: Signal<Service[]>;

  constructor(private service: ServiceService, private injector: Injector) {}

  ngOnInit(): void {
    this.services = toSignal(this.service.getAllServices(), {
      initialValue: [],
      injector: this.injector,
    });

    this.service.getAllServices().subscribe((services) => {
      console.log('services', services);
    });
  }

  getServiceSvg(type: string) {
    return type.split('-')[0];
  }
}
