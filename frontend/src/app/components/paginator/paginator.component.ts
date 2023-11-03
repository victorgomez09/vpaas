import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.css']
})
export class PaginatorComponent {

  @Input() currentPage: number;
  @Input() itemsPerPage: number;
  @Input() totalItems: number;
  @Output() pageChanged: EventEmitter<number>;

  constructor() {
    this.currentPage = 0;
    this.itemsPerPage = 0;
    this.totalItems = 0;
    this.pageChanged = new EventEmitter();
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.pageChanged.emit(page);
    }
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get showingItems(): string {
    let initial: number = this.currentPage;
    let of: number = this.itemsPerPage;

    if (this.currentPage !== 1) {
      initial = (Number(`${this.currentPage}${this.itemsPerPage}`) / 10) - 10;
      of = Number(`${this.currentPage}${this.itemsPerPage}`) / 10;
    }

    if (this.currentPage === this.totalPages) {
      of = this.totalItems;
    }

    console.log('test', `${this.currentPage}${this.itemsPerPage}`)

    return `${initial} - ${of}`;
  }
}
