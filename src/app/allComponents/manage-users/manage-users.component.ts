import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';



const API_URL = 'http://localhost:8000';

@Component({
  selector: 'app-manage-users',
  imports: [CommonModule, ReactiveFormsModule, FormsModule,],
  templateUrl: './manage-users.component.html',
  styleUrl: './manage-users.component.css'
})
export class ManageUsersComponent implements OnInit {

  userTabs: string[] = ['Register New User', 'View/Edit Users'];
  selectedUserTab: string = 'Register New User';

  regUserForm: FormGroup;
  regFile?: File;

  searchCnic: string = '';
  users: any[] = [];

  editingUserId: number | null = null;
  editingUserForm: FormGroup;
  editFile?: File;


  constructor(private fb: FormBuilder, private http: HttpClient, private datePipe: DatePipe, private router: Router) {

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
    
    this.editingUserForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone_number: ['', Validators.required],
      registration_number: ['', Validators.required],
      plate_number: ['', Validators.required],
      cnic:['',Validators.required]
    });
  }
  ngOnInit(): void {
    this.getUsers();
  }

  onRegFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.regFile = file;
    }
  }

  registerUser(): void {
    if (this.regUserForm.invalid || !this.regFile) {
      return;
    }
  
    const formData = new FormData();
    Object.entries(this.regUserForm.value).forEach(([key, value]) => {
      if (key !== 'confirmPassword') { // we don't need to send confirmPassword
        formData.append(key, value as string);
      }
    });
    formData.append('face_image', this.regFile, this.regFile.name);
  
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  
    this.http.post<any>(`${API_URL}/userdata/`, formData, { headers }).subscribe({
      next: (res) => {
        this.regUserForm.reset();
        this.regFile = undefined;
        if (this.selectedUserTab === 'View/Edit Users') {
          this.getUsers();
        }
      },
      error: (err) => {
        console.error('Registration error:', err);
      }
    });
  }
  

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
      },
      error: (err) => {
        console.error('Error fetching users:', err);
      }
    });
  }
  resetSearch(): void {
    this.searchCnic = '';
    this.getUsers();
  }

  startEditing(user: any): void {
    this.editingUserId = user.id;
    this.editingUserForm.patchValue({
      name: user.name,
      email: user.email,
      cnic:user.cnic,
      phone_number: user.phone_number,
      registration_number: user.registration_number,
      plate_number: user.plate_number
    });
  }

  cancelEditing(): void {
    this.editingUserId = null;
  }
  
  updateUser(userId: number): void {
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    const updatedData = {
      name: this.editingUserForm.value.name,
      email: this.editingUserForm.value.email,
      phone_number: this.editingUserForm.value.phone_number,
      registration_number: this.editingUserForm.value.registration_number,
      cnic: this.editingUserForm.value.cnic,
      plate_number: this.editingUserForm.value.plate_number
    };


    this.http.put<any>(`${API_URL}/userdata/${userId}`, updatedData, { headers }).subscribe({
      next: () => {
        this.editingUserId = null;
        this.getUsers();
      },
      error: (err) => {
        console.error('Update error:', err);
      }
    });
  }

  deleteUser(userId: number): void {
    const confirmed = window.confirm('Are you sure you want to delete this user?');
  if (!confirmed) {
    return;
  }
    const token = sessionStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.delete<any>(`${API_URL}/userdata/${userId}`, { headers }).subscribe({
      next: () => {
        this.getUsers();
      },
      error: (err) => {
        console.error('Delete error:', err);
      }
    });
  }

}
