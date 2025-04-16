import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { GateVideoComponent } from "../gate-video/gate-video.component";
import { AccessLogsComponent } from "../access-logs/access-logs.component";
import { SettingsComponent } from "../settings/settings.component";
import { ManageUsersComponent } from "../manage-users/manage-users.component";

const API_URL = 'http://localhost:8000';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule, GateVideoComponent, AccessLogsComponent, SettingsComponent, ManageUsersComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [DatePipe]
})
export class DashboardComponent implements OnInit {

  pages: string[] = [
    'Dashboard',
    'Manage Users and Vehicles',
    'Process Gate Video',
    'Access Logs',
    'Settings'
  ];
  pageIcons: { [key: string]: string } = {
    'Dashboard': 'dashboard',
    'Manage Users and Vehicles': 'group',
    'Process Gate Video': 'videocam',
    'Access Logs': 'history',
    'Settings': 'settings'
  };

  selectedPage = 'Dashboard';

  registeredVehicles: number = 0;
  successfulAccess: number = 0;
  deniedAccess: number = 0;
  message: string = '';

  constructor(private http: HttpClient, private router: Router) { }

  get sessionStorage() {
    return window.sessionStorage;
  }

  ngOnInit(): void {
    this.getDashboardSummary();
  }

  onChangePage(page: string): void {
    this.selectedPage = page;
    this.message = '';
  }

  logout(): void {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
  getDashboardSummary(): void {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any>(`${API_URL}/userdata`, { headers }).subscribe({
      next: (res) => {
        this.registeredVehicles = Array.isArray(res) ? res.length : 0;
      },
      error: (err) => {
        console.error('Error fetching vehicles:', err);
      }
    });

    this.http.get<any>(`${API_URL}/access`, { headers }).subscribe({
      next: (res) => {
        if (Array.isArray(res)) {
          this.successfulAccess = res.filter((log: any) => log.status === 'Granted').length;
          this.deniedAccess = res.filter((log: any) => log.status === 'Denied').length;
        }
      },
      error: (err) => {
        console.error('Error fetching access logs:', err);
      }
    });
  }

  isSidebarCollapsed = false;

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
  
  isSidebarOpen = false;

  toggleSidebarMobile() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}