import { CommonModule } from '@angular/common';
import {
  Component,
  Injector,
  OnInit,
  WritableSignal,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PaginatorComponent } from 'src/app/components/paginator/paginator.component';
import { Destination } from 'src/app/core/models/destination.model';
import { DestinationService } from 'src/app/core/services/destination.service';

@Component({
  selector: 'app-destination',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    PaginatorComponent,
  ],
  templateUrl: './destination.component.html',
  styleUrls: ['./destination.component.css'],
})
export class DestinationComponent implements OnInit {
  public destinations!: WritableSignal<Destination[]>;
  public search: FormControl;
  public currentPage: number = 1;
  public itemsPerPage: number = 8;
  public totalItems!: number;

  private searchData: Destination[];

  constructor(private service: DestinationService, private injector: Injector) {
    this.destinations = signal([]);
    this.searchData = [];
    this.search = new FormControl('');
  }
  ngOnInit(): void {
    this.service.getAllDestinations().subscribe((data) => {
      this.destinations.set(data.slice(0, this.itemsPerPage));

      this.searchData = data;
      this.totalItems = data.length;
    });

    this.search.valueChanges.subscribe((text: string) => {
      this.destinations.set(
        this.searchData
          .filter((dest) =>
            dest.name.toLowerCase().includes(text.toLowerCase())
          )
          .slice(0, this.itemsPerPage)
      );
    });
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.destinations.set(
        this.searchData.slice(
          (this.currentPage - 1) * this.itemsPerPage,
          this.currentPage * this.itemsPerPage
        )
      );
    }
  }
}
