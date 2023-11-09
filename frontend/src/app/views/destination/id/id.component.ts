import { Component, OnInit, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DestinationService } from 'src/app/core/services/destination.service';
import { Destination } from 'src/app/core/models/destination.model';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-id',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './id.component.html',
  styleUrls: ['./id.component.css'],
})
export class IdComponent implements OnInit {
  public destintation!: WritableSignal<Destination>;
  public updated: WritableSignal<boolean>;
  public loading: WritableSignal<boolean>;
  public loadingForce: WritableSignal<boolean>;
  public form: FormGroup;

  private id!: string;

  constructor(
    private service: DestinationService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.destintation = signal({} as Destination);
    this.updated = signal(false);
    this.loading = signal(false);
    this.loadingForce = signal(false);

    this.form = fb.group({
      name: ['', Validators.required],
      network: ['', Validators.required],
      proxy: [''],
    });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')!;

    this.service.getDestinationById(this.id).subscribe((data) => {
      this.destintation.set(data);
      this.form.setValue({
        name: data.name,
        network: data.network,
        proxy: data.isProxyUsed,
      });
    });
  }

  handleProxyChange() {
    this.loading.set(true);
    this.service
      .updateDestinationProxy(this.id, this.form.value['proxy'])
      .subscribe((data) => {
        this.destintation.update((dest) => {
          return {
            ...dest,
            isProxyUsed: data.isProxyUsed,
          };
        });

        this.loading.set(false);
      });
  }

  handleFormSubmit() {
    this.loading.set(true);
    this.service
      .updateDestination(this.id, this.form.value)
      .subscribe((data) => {
        this.destintation.update((dest) => {
          return {
            ...dest,
            name: data.name,
            network: data.network,
            isProxyUsed: data.isProxyUsed,
          };
        });
        this.loading.set(false);
        this.updated.set(true);
      });
  }

  forceProxyRestart() {
    this.loadingForce.set(true);
    this.service.updateDestinationProxyForce(this.id).subscribe((data) => {
      this.destintation.update((dest) => {
        return {
          ...dest,
          isProxyUsed: data.isProxyUsed,
        };
      });
      this.loadingForce.set(false);
    });
  }

  delete() {
    this.service.deleteDestination(this.id).subscribe(() => {
      window.HSOverlay.close(
        document.getElementById('hs-vertically-centered-modal')
      );
      this.router.navigate(['/destinations']);
    });
  }
}
