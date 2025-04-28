import { Component } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

const API_URL = 'http://localhost:8000';
@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.css'
})

export class UserDetailComponent {

  searchCnic: string = '';
  message: string = '';
  users: any[] = [];

  pages: string[] = [
    'User Dashboard',
    'Rules Page'
  ];
  pageIcons: { [key: string]: string } = {
    'User Dashboard': 'dashboard',
    'Rules Page': 'policy'
  };

  selectedPage = 'User Dashboard';

  constructor(private http: HttpClient, private router: Router) { }

  getUsers(): void {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    let url = `${API_URL}/userdata/`;
    if (this.searchCnic?.trim()) {
      url = `${API_URL}/userdata/cnic/${this.searchCnic.trim()}`;
    }

    this.http.get<any>(url, { headers }).subscribe({
      next: (res) => {
        if (this.searchCnic && !Array.isArray(res)) {
          this.users = [res];
        } else if (Array.isArray(res)) {
          this.users = res;
        } else {
          this.users = [];
        }
        this.message = this.users.length === 0 ? 'No users found.' : '';
      },
      error: (err) => {
        this.message = 'Failed to fetch users.';
        console.error('Error fetching users:', err);
      }
    });
  }
  resetSearch(): void {
    this.searchCnic = '';
  }

  isSidebarCollapsed = false;

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
  onChangePage(page: string): void {
    this.selectedPage = page;
  }
}
