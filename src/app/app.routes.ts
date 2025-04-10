import { Routes } from '@angular/router';
import path from 'node:path';
import { LoginRegisterComponent } from './allComponents/login-register/login-register.component';
import { DashboardComponent } from './allComponents/dashboard/dashboard.component';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
    { path:'login',component:LoginRegisterComponent},
    { path:'dashboard',component:DashboardComponent, canActivate: [AuthGuard]},
    { path: '', redirectTo: '/login', pathMatch: 'full' }  
];
