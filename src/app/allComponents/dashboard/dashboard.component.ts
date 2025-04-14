import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
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
  // --- Side Navigation & Page Routing ---

  pages: string[] = [
    'Dashboard',
    'Manage Users and Vehicles',
    'Process Gate Video',
    'Access Logs',
    'Settings'
  ];

  selectedPage: string = 'Dashboard';

  // --- Dashboard Summary Metrics ---
  registeredVehicles: number = 0;
  successfulAccess: number = 0;
  deniedAccess: number = 0;

  // --- User Management: Tabs & Messages ---
  userTabs: string[] = ['Register New User', 'View/Edit Users'];
  selectedUserTab: string = 'Register New User';
  message: string = '';

  constructor( private http: HttpClient, private router: Router) {}

  // Expose sessionStorage to template
  get sessionStorage() {
    return window.sessionStorage;
  }

  ngOnInit(): void {
    // On init, load summary metrics
    this.getDashboardSummary();
  }

  // --- Navigation methods ---
  onChangePage(page: string): void {
    this.selectedPage = page;
    this.message = '';

    // When navigating to "Manage Users and Vehicles", default to Registration tab
    if (page === 'Manage Users and Vehicles') {
      this.selectedUserTab = 'Register New User';
    }
  }

  logout(): void {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  // --- Dashboard Summary Metrics (Vehicles & Access Logs) ---
  getDashboardSummary(): void {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    // Fetch vehicles list (expecting an array)
    this.http.get<any>(`${API_URL}/userdata`, { headers }).subscribe({
      next: (res) => {
        this.registeredVehicles = Array.isArray(res) ? res.length : 0;
      },
      error: (err) => {
        console.error('Error fetching vehicles:', err);
      }
    });

    // Fetch access logs and calculate success/denied counts
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


}