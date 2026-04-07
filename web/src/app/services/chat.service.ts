import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/chat`;

  constructor(private http: HttpClient) {}

  sendMessage(apiKey: string, message: string, sessionId: string): Observable<any> {
    const headers = new HttpHeaders({ 'x-api-key': apiKey });

    return this.http.post<any>(this.apiUrl, {
      message,
      sessionId
    }, { headers });
  }

  getHistory(apiKey: string, sessionId: string): Observable<any[]> {
    const headers = new HttpHeaders({ 'x-api-key': apiKey });
    return this.http.get<any[]>(`${this.apiUrl}/history/${sessionId}`, { headers });
  }

  deleteHistory(apiKey: string, sessionId: string): Observable<any> {
    const headers = new HttpHeaders({ 'x-api-key': apiKey });
    return this.http.delete<any>(`${this.apiUrl}/history/${sessionId}`, { headers });
  }

  getAnalytics(tenantId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/${tenantId}`);
  }
}
