import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(data: { email: string, password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data).pipe(
      tap((res: any) => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('tenantId', res.tenantId);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
}