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

const API_URL = 'http://localhost:8000';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule],
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

  // --- Registration Form (Register New User Tab) ---
  regUserForm: FormGroup;
  regFile?: File;

  // --- View/Edit Users ---
  searchCnic: string = '';
  users: any[] = [];

  // --- Edit User State ---
  editingUserId: number | null = null;
  editingUserForm: FormGroup;
  editFile?: File;

  // --- Process Gate Video properties ---
  gateVideoFile: File | null = null;
  faceVideoFile: File | null = null;
  gateVideoUrl: string = '';
  faceVideoUrl: string = '';
  processResult: any = null;
  processing: boolean = false;

  // --- Access Logs properties ---
  startDate: Date;
  endDate: Date;
  statusFilter: string[] = ['Granted', 'Denied', 'Pending'];
  accessLogs: any[] = [];
  loadingLogs: boolean = false;

  // --- Settings page properties ---
  userData: any = null;
  passwordForm: FormGroup;
  passwordChangeMessage: string = '';

  constructor(private fb: FormBuilder, private http: HttpClient, private datePipe: DatePipe, private router: Router) {
    // Set default date ranges (last 30 days)
    const today = new Date();
    this.startDate = new Date(today);
    this.startDate.setDate(today.getDate() - 30);
    this.endDate = today;

    // Registration form for new user (all fields required)
    this.regUserForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone_number: ['', Validators.required],
      cnic: ['', Validators.required],
      registration_number: ['', Validators.required],
      plate_number: ['', Validators.required],
      model: ['', Validators.required],
      color: ['', Validators.required]
    });

    // Edit form (only editable fields; CNIC is assumed unchangeable)
    this.editingUserForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone_number: ['', Validators.required],
      registration_number: ['', Validators.required],
      plate_number: ['', Validators.required]
    });

    // Password change form
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    });
  }

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
    this.passwordChangeMessage = '';

    // When navigating to "Manage Users and Vehicles", default to Registration tab
    if (page === 'Manage Users and Vehicles') {
      this.selectedUserTab = 'Register New User';
    } else if (page === 'Settings') {
      this.loadUserData();
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

  // --- Registration Tab: File selected handler ---
  onRegFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.regFile = file;
    }
  }

  // --- Register New User Submission ---
  registerUser(): void {
    if (this.regUserForm.invalid || !this.regFile) {
      this.message = 'All fields are required, including face image.';
      return;
    }

    const formData = new FormData();
    Object.entries(this.regUserForm.value).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    formData.append('face_image', this.regFile, this.regFile.name);

    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.post<any>(`${API_URL}/userdata/`, formData, { headers }).subscribe({
      next: (res) => {
        this.message = 'User registered successfully!';
        this.regUserForm.reset();
        this.regFile = undefined;
        // Refresh dashboard summary or user list if needed:
        this.getDashboardSummary();
        if (this.selectedUserTab === 'View/Edit Users') {
          this.getUsers();
        }
      },
      error: (err) => {
        this.message = err.error?.detail || 'Failed to register user.';
        console.error('Registration error:', err);
      }
    });
  }

  // --- View/Edit Tab: Search & List Users ---
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
    this.getUsers();
  }

  // --- Start editing a user ---
  startEditing(user: any): void {
    this.editingUserId = user.id;
    this.editingUserForm.patchValue({
      name: user.name,
      email: user.email,
      phone_number: user.phone_number,
      registration_number: user.registration_number,
      plate_number: user.plate_number
    });
    this.editFile = undefined;
  }

  cancelEditing(): void {
    this.editingUserId = null;
  }

  // --- File selection in edit mode ---
  onEditFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.editFile = file;
    }
  }

  // --- Update User ---
  updateUser(userId: number): void {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    // Build JSON payload matching the backend model.
    const updatedData = {
      name: this.editingUserForm.value.name,
      email: this.editingUserForm.value.email,
      phone_number: this.editingUserForm.value.phone_number,
      registration_number: this.editingUserForm.value.registration_number,
      // If the backend requires face_embedding, pass null if not updating.
      face_embedding: null
    };

    // Send update as JSON (remove FormData if not needed)
    this.http.put<any>(`${API_URL}/userdata/${userId}`, updatedData, { headers }).subscribe({
      next: () => {
        this.message = 'User updated successfully!';
        this.editingUserId = null;
        this.getUsers();
      },
      error: (err) => {
        this.message = err.error?.detail || 'Failed to update user.';
        console.error('Update error:', err);
      }
    });
  }

  // --- Delete User ---
  deleteUser(userId: number): void {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.delete<any>(`${API_URL}/userdata/${userId}`, { headers }).subscribe({
      next: () => {
        this.message = 'User deleted successfully!';
        this.getUsers();
      },
      error: (err) => {
        this.message = 'Failed to delete user.';
        console.error('Delete error:', err);
      }
    });
  }

  // --- Process Gate Video: File selection for Gate Video ---
  onGateVideoSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.gateVideoFile = file;
      this.gateVideoUrl = URL.createObjectURL(file);
    }
  }

  // --- Process Gate Video: File selection for Face Video (Optional) ---
  onFaceVideoSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.faceVideoFile = file;
      this.faceVideoUrl = URL.createObjectURL(file);
    }
  }

  // --- Process Gate Video Submission ---
  processGateVideo(): void {
    if (!this.gateVideoFile) {
      this.message = "Please upload a gate video.";
      return;
    }

    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    const formData = new FormData();
    formData.append("gate_video", this.gateVideoFile, this.gateVideoFile.name);
    if (this.faceVideoFile) {
      formData.append("face_video", this.faceVideoFile, this.faceVideoFile.name);
    }

    this.processing = true;
    this.http.post<any>(`${API_URL}/api/process-gate-video`, formData, { headers }).subscribe({
      next: (res) => {
        this.processResult = res;
        this.processing = false;
      },
      error: (err) => {
        this.message = err.error?.detail || "Failed to process video";
        this.processing = false;
        console.error('Process Gate Video error:', err);
      }
    });
  }

  // --- NEW: Access Logs Methods ---
  fetchAccessLogs(): void {
    this.loadingLogs = true;
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any>(`${API_URL}/access`, { headers }).subscribe({
      next: (logs) => {
        if (Array.isArray(logs)) {
          // Filter logs by date range and status
          this.accessLogs = logs.filter(log => {
            const entryTime = new Date(log.entry_time);
            return (
              entryTime >= this.startDate &&
              entryTime <= this.endDate &&
              this.statusFilter.includes(log.status)
            );
          });

          // Fetch vehicle details for each log
          this.enrichLogsWithDetails(logs);
        } else {
          this.accessLogs = [];
        }
        this.loadingLogs = false;
      },
      error: (err) => {
        console.error('Error fetching access logs:', err);
        this.message = 'Failed to fetch access logs';
        this.loadingLogs = false;
      }
    });
  }

  // Helper function to enrich logs with vehicle and user details
  enrichLogsWithDetails(logs: any[]): void {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    // Get unique vehicle IDs
    const vehicleIds = [...new Set(logs.map(log => log.vehicle_id))];

    // Get unique user IDs
    const userIds = [...new Set(logs.map(log => log.user_id))];

    // Create a map to store vehicle details
    const vehicleDetails: { [key: string]: any } = {};
    const userDetails: { [key: string]: any } = {};

    // Fetch vehicle details
    const vehiclePromises = vehicleIds.map(id =>
      this.http.get<any>(`${API_URL}/vehicles/${id}`, { headers }).toPromise()
        .then(data => {
          vehicleDetails[id] = data;
        })
        .catch(err => {
          console.error(`Error fetching vehicle ${id}:`, err);
        })
    );

    // Fetch user details if user is admin
    let userPromises: Promise<any>[] = [];
    const userRole = sessionStorage.getItem('user_role');
    if (userRole === 'admin') {
      userPromises = userIds.map(id =>
        this.http.get<any>(`${API_URL}/users/${id}`, { headers }).toPromise()
          .then(data => {
            userDetails[id] = data;
          })
          .catch(err => {
            console.error(`Error fetching user ${id}:`, err);
          })
      );
    }

    // Wait for all fetches to complete
    Promise.all([...vehiclePromises, ...userPromises]).then(() => {
      // Enrich logs with fetched details
      this.accessLogs = this.accessLogs.map(log => {
        return {
          ...log,
          vehicle: vehicleDetails[log.vehicle_id] || { plate_number: 'Unknown', model: 'Unknown' },
          user: userDetails[log.user_id] || { name: 'Unknown', email: 'Unknown' }
        };
      });
    });
  }

  // --- NEW: Settings Page Methods ---
  loadUserData(): void {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any>(`${API_URL}/users/me`, { headers }).subscribe({
      next: (userData) => {
        this.userData = userData;
      },
      error: (err) => {
        console.error('Error fetching user data:', err);
        this.message = 'Failed to fetch user data';
      }
    });
  }

  changePassword(): void {
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      this.passwordChangeMessage = 'New passwords do not match!';
      return;
    }

    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.post<any>(`${API_URL}/auth/change-password`, {
      current_password: currentPassword,
      new_password: newPassword
    }, { headers }).subscribe({
      next: () => {
        this.passwordChangeMessage = 'Password changed successfully!';
        this.passwordForm.reset();
      },
      error: (err) => {
        this.passwordChangeMessage = err.error?.detail || 'Failed to change password';
        console.error('Password change error:', err);
      }
    });
  }
  // Add this method to your DashboardComponent class
  onStatusFilterChange(status: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    if (isChecked) {
      // Add status to filter if not already there
      if (!this.statusFilter.includes(status)) {
        this.statusFilter = [...this.statusFilter, status];
      }
    } else {
      // Remove status from filter
      this.statusFilter = this.statusFilter.filter(s => s !== status);
    }
  }
}