import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

const API_URL = 'http://localhost:8000';

@Component({
  selector: 'app-access-logs',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './access-logs.component.html',
  styleUrls: ['./access-logs.component.css'],
  providers: [DatePipe]
})
export class AccessLogsComponent {
  startDate: Date;
  endDate: Date;
  statusFilter: string[] = ['Granted', 'Denied'];
  accessLogs: any[] = [];
  loadingLogs: boolean = false;
  message: string = '';
  userRole: string = '';
  unrecognized_plate: any;
  data: any = null;

  constructor(private http: HttpClient, private datePipe: DatePipe) {
    const today = new Date();
    this.endDate = today;
    this.startDate = new Date(today);
    this.startDate.setDate(today.getDate() - 30);

    this.userRole = sessionStorage.getItem('admin') || ''; // Add your role fetch logic
    this.fetchAccessLogs();
  }

  onStatusFilterChange(status: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked && !this.statusFilter.includes(status)) {
      this.statusFilter.push(status);
    } else if (!checked) {
      this.statusFilter = this.statusFilter.filter(s => s !== status);
    }
  }

  fetchAccessLogs(): void {
    this.loadingLogs = true;
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any[]>(`${API_URL}/access`, { headers }).subscribe({
      next: (logs) => {
        this.data = logs;
        const filteredLogs = logs.filter(log => {
          const entryTime = new Date(log.entry_time);
          return (
            entryTime >= new Date(this.startDate) &&
            entryTime <= new Date(this.endDate) &&
            this.statusFilter.includes(log.status)
          );
        });

        this.enrichLogsWithDetails(filteredLogs, headers);
      },
      error: (err) => {
        console.error('Error fetching access logs:', err);
        this.message = 'Failed to fetch access logs';
        this.loadingLogs = false;
      }
    });
  }

  enrichLogsWithDetails(logs: any[], headers: HttpHeaders): void {
    const vehicleIds = [...new Set(logs.map(log => log.vehicle_id).filter(id => id))];

    const userIds = [...new Set(logs.map(log => log.user_id).filter(id => id))];


    const vehicleRequests = vehicleIds.map(id =>
      this.http.get(`${API_URL}/vehicles/${id}`, { headers }).toPromise().then(res => ({ id, data: res }))
    );

    let userRequests: Promise<any>[] = [];
    if (this.userRole === 'admin') {
      userRequests = userIds.map(id =>
        this.http.get(`${API_URL}/users/${id}`, { headers }).toPromise().then(res => ({ id, data: res }))
      );
    }

    Promise.all([...vehicleRequests, ...userRequests]).then(results => {
      const vehicleMap = new Map<string, any>();
      const userMap = new Map<string, any>();

      results.forEach(res => {
        if ('data' in res && res.data && res.id) {
          if ('plate_number' in res.data) {
            vehicleMap.set(res.id, res.data);
          } else if ('email' in res.data) {
            userMap.set(res.id, res.data);
          }
        }
      });

      this.accessLogs = logs.map(log => ({
        ...log,
        vehicle: vehicleMap.get(log.vehicle_id),
        user: this.userRole === 'admin' ? userMap.get(log.user_id) : null
      }));

      this.loadingLogs = false;
    });
  }
}