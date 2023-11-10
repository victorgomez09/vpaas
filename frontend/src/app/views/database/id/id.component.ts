import { Component, OnInit, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { DatabaseService } from 'src/app/core/services/database.service';
import {
  AvailableDatabase,
  Database,
  DatabaseUsage,
} from 'src/app/core/models/database.model';
import { Settings } from 'src/app/core/models/settings.model';
import { Observable } from 'rxjs';
import { settingsStore } from 'src/app/core/stores/settings.store';

@Component({
  selector: 'app-id',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './id.component.html',
  styleUrls: ['./id.component.css'],
})
export class IdComponent implements OnInit {
  public database!: WritableSignal<Database>;
  public databaseTemplate!: AvailableDatabase;
  public isRunning: WritableSignal<boolean>;
  public logs: WritableSignal<string[]>;
  public usage: WritableSignal<DatabaseUsage>;
  public form: FormGroup;

  public showConnectionString: WritableSignal<boolean>;

  public databaseStatusLoader: WritableSignal<boolean>;
  public databaseBackupLoader: WritableSignal<boolean>;

  private id!: string;
  private privatePort!: number;
  private settings: Observable<Settings | null>;

  constructor(
    private service: DatabaseService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.database = signal<Database>({} as Database);
    this.isRunning = signal(false);
    this.logs = signal([]);
    this.usage = signal({} as DatabaseUsage);
    this.databaseStatusLoader = signal(false);
    this.databaseBackupLoader = signal(false);
    this.showConnectionString = signal(false);
    this.settings = settingsStore.settings;

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
      this.database.set(data.database);
      this.privatePort = data.privatePort;

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

      this.service
        .getAvailableDatabaseByName(data.database.type)
        .subscribe((data) => {
          this.databaseTemplate = data;
          this.form.patchValue({
            type: data.fancyName,
          });
        });

      this.form.patchValue({
        name: data.database.name,
        version: data.database.version,
        defaultDatabase: data.database.defaultDatabase,
        dbUser: data.database.dbUser,
        rootUser: data.database.rootUser,
        publicAccess: data.database.publicPort,
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

  openUsage() {
    this.service.getDatabaseUsage(this.id).subscribe((data) => {
      console.log(data);
      this.usage.set(data.usage);
    });
  }

  createBackup() {
    this.databaseBackupLoader.set(true);
    this.service.getDatabaseBackup(this.id);
    this.databaseBackupLoader.set(false);
  }

  delete() {
    this.service.deleteDatabase(this.id).subscribe(() => {
      this.router.navigate(['/databases']);
    });
  }

  showConnectionStringHandler() {
    this.showConnectionString.set(!this.showConnectionString());
  }

  private ipAddress() {
    if (this.database().settings?.isPublic) {
      // if (this.database().destination?.remoteEngine) {
      //   return database.destinationDocker.remoteIpAddress;
      // }
      return this.settings.subscribe((data) => {
        if (data && data.ipv6) return data.ipv6;
        if (data && data.ipv4) return data.ipv4;

        return '<Cannot determine public IP address>';
      });
      // if (this.settings.ipv6) {
      //   return $appSession.ipv6;
      // }
      // if ($appSession.ipv4) {
      //   return $appSession.ipv4;
      // }
      // return '<Cannot determine public IP address>';
    } else {
      return this.database().id;
    }
  }

  generateUrl() {
    const user = () => {
      if (this.database().dbUser) {
        return this.database().dbUser + ':';
      }
      return '';
    };
    const port = () => {
      if (this.database().settings?.isPublic) {
        return this.database().publicPort;
      } else {
        return this.privatePort;
      }
    };
    return `${this.database().type}://${user()}${
      this.database().dbUserPassword
    }@${this.ipAddress()}:${port()}/${this.database().defaultDatabase}`;
  }
}
