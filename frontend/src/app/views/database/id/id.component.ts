import {
  Component,
  Injector,
  OnInit,
  WritableSignal,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DatabaseService } from 'src/app/core/services/database.service';
import {
  AvailableDatabase,
  Database,
} from 'src/app/core/models/database.model';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-id',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './id.component.html',
  styleUrls: ['./id.component.css'],
})
export class IdComponent implements OnInit {
  public database!: WritableSignal<Database>;
  public databaseTemplate!: AvailableDatabase;
  public isRunning: WritableSignal<boolean>;
  public logs: WritableSignal<string[]>;
  public form: FormGroup;

  public databaseStatusLoader: WritableSignal<boolean>;

  private id!: string;

  constructor(
    private service: DatabaseService,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.database = signal<Database>({} as Database);
    this.isRunning = signal(false);
    this.logs = signal([]);
    this.databaseStatusLoader = signal(false);

    this.form = this.fb.group({
      name: [''],
      type: [''],
      version: [''],
      defaultDatabase: [''],
      dbUser: [''],
      dbUserPassword: [''],
      rootUser: [''],
      rootUserPassword: [''],
      publicAccess: [false],
    });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')!;

    this.service.getDatabaseById(this.id).subscribe((data) => {
      this.database.set(data);

      this.service.getDatabaseStatus(this.id).subscribe((data) => {
        this.isRunning.set(data.isRunning);
      });

      this.service.getDatabaseSecretsById(this.id).subscribe((data) => {
        this.form.patchValue({
          dbUserPassword: data.find((d) => d.name === 'dbUserPassword')?.value,
          rootUserPassword: data.find((d) => d.name === 'rootUserPassword')
            ?.value,
        });
      });

      this.service.getAvailableDatabaseByName(data.type).subscribe((data) => {
        this.databaseTemplate = data;
        this.form.patchValue({
          type: data.fancyName,
        });
      });

      this.form.patchValue({
        name: data.name,
        version: data.version,
        defaultDatabase: data.defaultDatabase,
        dbUser: data.dbUser,
        rootUser: data.rootUser,
        publicAccess: data.publicPort,
      });
    });
  }

  startDatabase() {
    this.databaseStatusLoader.set(true);
    this.service.startDatabase(this.id).subscribe(() => {
      this.isRunning.set(true);
      this.databaseStatusLoader.set(false);
    });
  }

  stopDatabase() {
    this.databaseStatusLoader.set(true);
    this.service.stopDatabase(this.id).subscribe(() => {
      this.isRunning.set(false);
      this.databaseStatusLoader.set(false);
    });
  }

  openLogs() {
    this.service.getDatabaseLogs(this.id).subscribe((data) => {
      this.logs.set(data.logs);
    });
  }
}