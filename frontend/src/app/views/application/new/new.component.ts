import {
  Component,
  Injector,
  OnInit,
  Signal,
  WritableSignal,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ApplicationService } from 'src/app/core/services/application.service';
import { DestinationService } from 'src/app/core/services/destination.service';
import { Destination } from 'src/app/core/models/destination.model';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new.component.html',
  styleUrl: './new.component.css',
})
export class NewComponent implements OnInit {
  public repoUrl: FormControl;
  public branches: WritableSignal<{ value: string; label: string }[]>;
  public destinations!: Signal<Destination[]>;
  public selectedDestination!: Destination;

  public loading: WritableSignal<boolean>;

  private branchName!: string;
  private ownerName!: string;
  private repositoryName!: string;
  private projectId!: string;
  private type!: string;

  constructor(
    private service: ApplicationService,
    private destinationService: DestinationService,
    private injector: Injector
  ) {
    this.repoUrl = new FormControl('');
    this.branches = signal([]);
    this.loading = signal(false);
  }

  ngOnInit(): void {
    this.destinations = toSignal(this.destinationService.getAllDestinations(), {
      initialValue: [],
      injector: this.injector,
    });
  }

  async loadRepository() {
    this.loading.set(true);
    const data = await this.service.loadBranches(this.repoUrl.value);
    this.branches.set(data.branchSelectOptions);
    this.branchName = data.branchName;
    this.ownerName = data.ownerName;
    this.repositoryName = data.repositoryName;
    this.projectId = data.projectId;
    this.type = data.type;
    this.loading.set(false);
  }

  selectBranch(event: any) {
    console.log(event.target.value);
    this.service.saveRepository(
      this.branchName,
      this.ownerName,
      this.repositoryName,
      this.projectId,
      this.type,
      this.selectedDestination.id
    );
  }

  selectDestination(destination: Destination) {
    this.selectedDestination = destination;
    window.HSTabs.open(document.getElementById('select-repository-id'));
  }
}
