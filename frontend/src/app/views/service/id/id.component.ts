import {
  Component,
  Injector,
  OnInit,
  Signal,
  WritableSignal,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ServiceService } from 'src/app/core/services/service.service';
import { Service, ServiceSettings } from 'src/app/core/models/service.model';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Destination } from 'src/app/core/models/destination.model';

@Component({
  selector: 'app-id',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './id.component.html',
  styleUrl: './id.component.css',
})
export class IdComponent implements OnInit {
  public serviceData!: WritableSignal<Service>;
  public templates!: any;
  public templateKeys!: string[];
  public destinations!: Signal<Destination[]>;
  public tags!: string[];

  public form: FormGroup;

  private id!: string;

  constructor(
    private service: ServiceService,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.serviceData = signal({} as Service);

    this.form = this.fb.group({
      fqdn: [''],
      name: ['', [Validators.required]],
      exposePort: [
        12345,
        [Validators.required, Validators.min(1), Validators.max(65535)],
      ],
      createdAt: [''],
    });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')!;

    this.service.getServiceById(this.id).subscribe((data) => {
      this.serviceData.set(data.service);
      this.templateKeys = Object.keys(data.template);
      this.templates = data.template;
      this.tags = data.tags.tags;
      console.log(data);

      this.service.getServiceStatusById(this.id).subscribe((data) => {
        console.log(data);
      });

      this.form.patchValue({
        fqdn: data.service.fqdn,
        name: data.service.name,
        exposedPort: data.service.exposePort,
      });
    });
  }

  generateName(template: any) {
    return (
      template.name ||
      template
        .replace(`${this.id}-`, '')
        .replace(this.id, this.serviceData().type)
    );
  }

  getDomain(domain: string) {
    return domain?.replace('https://', '').replace('http://', '');
  }

  print(variable: any) {
    console.log(variable);
  }
}
