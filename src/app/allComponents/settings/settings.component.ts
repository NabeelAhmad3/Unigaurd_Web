import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

const API_URL = 'http://localhost:8000';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  userData: any = null;
  passwordForm: FormGroup;
  passwordChangeMessage: string = '';
  message: string = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    const token = sessionStorage.getItem('token');
    if (!token) return;

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
    if (!token) return;

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
}
