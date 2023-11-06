import {
  Component,
  Injector,
  OnInit,
  Signal,
  WritableSignal,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  AvailableDatabase,
  Database,
} from 'src/app/core/models/database.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatabaseService } from 'src/app/core/services/database.service';
import { DestinationService } from 'src/app/core/services/destination.service';
import { Destination } from 'src/app/core/models/destination.model';

@Component({
  selector: 'app-new',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.css'],
})
export class NewComponent implements OnInit {
  public availableDatabases!: Signal<AvailableDatabase[]>;
  public destinations!: Signal<Destination[]>;
  public selectedDatabase!: AvailableDatabase;
  public selectedVersion!: string;
  public selectedDestination!: Destination;
  public createdDatabase!: Database;
  public form!: FormGroup;

  // Loaders
  public pullingDatabaseImage: WritableSignal<boolean>;
  public createDatabase: WritableSignal<boolean>;

  constructor(
    private service: DatabaseService,
    private destinationService: DestinationService,
    private fb: FormBuilder,
    private injector: Injector
  ) {
    this.pullingDatabaseImage = signal(false);
    this.createDatabase = signal(false);
  }

  ngOnInit(): void {
    this.form = this.fb.group({});
    this.availableDatabases = toSignal(this.service.getAvailableDatabases(), {
      initialValue: [],
      injector: this.injector,
    });
    this.destinations = toSignal(this.destinationService.getAllDestinations(), {
      initialValue: [],
      injector: this.injector,
    });
  }

  selectDatabase(database: AvailableDatabase) {
    this.selectedDatabase = database;
    window.HSTabs.open(document.getElementById('basic-tabs-item-2'));
  }

  selectVersion(version: string) {
    this.selectedVersion = version;
    this.pullingDatabaseImage.set(true);
    this.service
      .getDatabaseImage(this.selectedDatabase.name, this.selectedVersion)
      .subscribe((data) => {
        console.log('data', data);
        this.pullingDatabaseImage.set(false);
        window.HSTabs.open(document.getElementById('basic-tabs-item-3'));
      });
  }

  selectDestination(destination: Destination) {
    this.createDatabase.set(true);
    this.selectedDestination = destination;
    this.service
      .create({
        type: this.selectedDatabase.name,
        version: this.selectedVersion,
        destinationDockerId: destination.id,
      })
      .subscribe((data) => {
        this.createdDatabase = data;
        this.createDatabase.set(false);
        window.HSTabs.open(document.getElementById('basic-tabs-item-4'));
      });
  }

  handleFormSubmit() {
    console.log('values', this.form.value);
  }
}
