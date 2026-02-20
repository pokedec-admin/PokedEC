import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SystemStatus {
    env: string;
    version: string;
    timestamp: string;
}

export interface MonitoringResult {
    env: string;
    url: string;
    status: 'ONLINE' | 'OFFLINE';
    version?: string;
    activeEnv?: string;
    responseTime?: string;
    error?: string;
}

export interface MonitoringResponse {
    [key: string]: MonitoringResult;
}

@Injectable({
    providedIn: 'root'
})
export class SystemService {
    private apiUrl = `${environment.apiUrl}/system`;

    constructor(private http: HttpClient) { }

    getStatus(): Observable<SystemStatus> {
        return this.http.get<SystemStatus>(`${this.apiUrl}/status`);
    }

    getMonitoring(): Observable<MonitoringResponse> {
        return this.http.get<MonitoringResponse>(`${this.apiUrl}/monitoring`);
    }

    deploy(target: 'blue' | 'green'): Observable<any> {
        return this.http.post(`${this.apiUrl}/deploy`, { target });
    }

    switchEnv(target: 'blue' | 'green'): Observable<any> {
        return this.http.post(`${this.apiUrl}/switch`, { target });
    }
}
