import { Component } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpParams} from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  standalone:true,
  selector: 'app-login-register',
  imports: [CommonModule,ReactiveFormsModule,HttpClientModule],
  templateUrl: './login-register.component.html',
  styleUrl: './login-register.component.css'
})

export class LoginRegisterComponent {
  loginForm: FormGroup;
  registerForm: FormGroup;
  showLogin = true;
  apiUrl = 'http://localhost:8000';
  message = '';
  
  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    });
  }

  toggleForm() {
    this.showLogin = !this.showLogin;
    this.message = '';
  }

 
login() {
  if (this.loginForm.invalid) {
    this.message = 'Please fill in all login fields correctly.';
    return;
  }

  const body = new HttpParams()
    .set('username', this.loginForm.value.email)
    .set('password', this.loginForm.value.password);

  const headers = new HttpHeaders({
    'Content-Type': 'application/x-www-form-urlencoded'
  });

  this.http.post<any>(`${this.apiUrl}/auth/login`, body.toString(), { headers })
    .subscribe({
      next: (res) => {
        sessionStorage.setItem('token', res.access_token);
        sessionStorage.setItem('user_id', res.user_id);
        sessionStorage.setItem('user_name', res.name);
        sessionStorage.setItem('user_role', res.role);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login error:', err);
        if (err.error.detail) {
          this.message = err.error.detail;
        } else {
          this.message = 'Login failed. Check your credentials.';
        }
      }
    });
}

  register() {
    if (this.registerForm.invalid || this.registerForm.value.password !== this.registerForm.value.confirmPassword) {
      this.message = 'Please fill in all fields correctly and ensure passwords match.';
      return;
    }

    const registerData = {
      name: this.registerForm.value.name,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      role: 'admin'
    };

    this.http.post<any>(`${this.apiUrl}/auth/register`, registerData)
      .subscribe({
        next: (res) => {
          this.message = 'Registration successful. Please login.';
          this.showLogin = true;
          // this.registerForm.reset();
          
        },
        error: (err) => {
          this.message = err.error.detail || 'Registration failed.';
        }
      });
  }
}
