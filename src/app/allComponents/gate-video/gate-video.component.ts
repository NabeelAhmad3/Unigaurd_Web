import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';

const API_URL = 'http://localhost:8000';

@Component({
  selector: 'app-gate-video',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './gate-video.component.html',
  styleUrls: ['./gate-video.component.css']
})
export class GateVideoComponent {
  gateVideoFile: File | null = null;
  faceVideoFile: File | null = null;
  gateVideoUrl: string = '';
  faceVideoUrl: string = '';
  processResult: any = null;
  processing: boolean = false;
  message: string = '';

  constructor(private http: HttpClient) {}

  onGateVideoSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      this.gateVideoFile = file;
      this.gateVideoUrl = URL.createObjectURL(file);
    } else {
      this.message = 'Please select a valid video file.';
    }
  }

  onFaceVideoSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      this.faceVideoFile = file;
      this.faceVideoUrl = URL.createObjectURL(file);
    } else {
      this.message = 'Please select a valid video file.';
    }
  }

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
        this.message = "Video processed successfully!";
        this.processing = false;
      },
      error: (err) => {
        this.message = err.error?.detail || "Failed to process video.";
        this.processing = false;
        console.error('Process Gate Video error:', err);
      }
    });
  }
}
