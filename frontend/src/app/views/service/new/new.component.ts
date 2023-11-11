import { Component, Injector, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

import { ServiceService } from 'src/app/core/services/service.service';
import { Service } from 'src/app/core/models/service.model';

@Component({
  selector: 'app-new',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './new.component.html',
  styleUrl: './new.component.css',
})
export class NewComponent {
  public availableTemplates!: Signal<any[]>;

  private exposePort: number;

  constructor(private service: ServiceService, private injector: Injector) {
    this.exposePort = 12345;
  }

  ngOnInit(): void {
    this.availableTemplates = toSignal(this.service.getAvailableServices(), {
      initialValue: [],
      injector: this.injector,
    });
  }

  selectService(data: any) {
    // const ports: string[] = [];
    // for (const service of Object.values(data.services)) {
    //   const s: any = service;
    //   if (s.proxy?.length > 0) {
    //     for (const proxy of Array.of(s.proxy)) {
    //       if (proxy.hostPort) {
    //         ports.push(`${proxy.hostPort}:${proxy.port}`);
    //       }
    //     }
    //   } else {
    //     if (s.ports?.length === 1) {
    //       for (const port of data.services[s].ports) {
    //         if (this.exposePort) {
    //           ports.push(`${this.exposePort}:${port}`);
    //         }
    //       }
    //     }
    //   }
    // }
    const service: Service = {
      type: data.type,
      exposePort: this.exposePort,
    };
    this.service.createService(service).subscribe((data) => {
      console.log('data', data.name);
    });
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
}
