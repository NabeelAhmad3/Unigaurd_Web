import { Routes } from '@angular/router';
import path from 'node:path';
import { LoginRegisterComponent } from './allComponents/login-register/login-register.component';
import { DashboardComponent } from './allComponents/dashboard/dashboard.component';
import { AuthGuard } from './auth.guard';
import { UserDetailComponent } from './allComponents/user-detail/user-detail.component';

export const routes: Routes = [
    { path: 'login', component: LoginRegisterComponent },
    { path: 'admin-dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: 'user-dashboard', component: UserDetailComponent },
    { path: '', redirectTo: '/admin-dashboard', pathMatch: 'full' }
];
