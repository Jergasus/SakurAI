import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private apiUrl = `${environment.apiUrl}/tenants`;

  constructor(private http: HttpClient) {}

  getTenant(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  updateTenant(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, data);
  }

  getAvailableTools(niche?: string): Observable<any[]> {
    const url = niche ? `${environment.apiUrl}/tools?niche=${niche}` : `${environment.apiUrl}/tools`;
    return this.http.get<any[]>(url);
  }

  updateAccount(id: string, payload: { email?: string; currentPassword?: string; newPassword?: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/account`, payload);
  }
}