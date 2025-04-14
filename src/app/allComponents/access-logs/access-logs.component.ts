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
  statusFilter: string[] = ['Granted', 'Denied', 'Pending'];
  accessLogs: any[] = [];
  loadingLogs: boolean = false;
  message: string = '';
sessionStorage: any;

  constructor(private http: HttpClient, private datePipe: DatePipe) {
    const today = new Date();
    this.endDate = today;
    this.startDate = new Date(today);
    this.startDate.setDate(today.getDate() - 30);
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
        const filteredLogs = logs.filter(log => {
          const entryTime = new Date(log.entry_time);
          return (
            entryTime >= new Date(this.startDate) &&
            entryTime <= new Date(this.endDate) &&
            this.statusFilter.includes(log.status)
          );
        });

        this.accessLogs = filteredLogs;
        this.enrichLogsWithDetails(filteredLogs);
        this.loadingLogs = false;
      },
      error: (err) => {
        console.error('Error fetching access logs:', err);
        this.message = 'Failed to fetch access logs';
        this.loadingLogs = false;
      }
    });
  }

  enrichLogsWithDetails(logs: any[]): void {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    const vehicleIds = [...new Set(logs.map(log => log.vehicle_id))];
    const userIds = [...new Set(logs.map(log => log.user_id))];

    const vehicleRequests = vehicleIds.map(id =>
      this.http.get(`${API_URL}/vehicles/${id}`, { headers }).toPromise().then(res => ({ id, data: res }))
    );

    const userRequests = userIds.map(id =>
      this.http.get(`${API_URL}/users/${id}`, { headers }).toPromise().then(res => ({ id, data: res }))
    );

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
        user: userMap.get(log.user_id)
      }));
    });
  }
  
}
