import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  isLoginMode = true;
  isLoading = false;

  formData = {
    name: '',
    niche: 'restaurant',
    email: '',
    password: ''
  };

  constructor(private authService: AuthService, private router: Router) {}

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  onSubmit() {
    this.isLoading = true;

    if (this.isLoginMode) {
      this.authService.login(this.formData).subscribe({
        next: () => {
          this.router.navigate(['/admin']);
        },
        error: () => {
          alert('Error: Invalid credentials');
          this.isLoading = false;
        }
      });
    } else {
      this.authService.register(this.formData).subscribe({
        next: () => {
          alert('Account created! You can now sign in.');
          this.isLoginMode = true;
          this.isLoading = false;
        },
        error: (err) => {
          alert('Error: ' + err.error.message);
          this.isLoading = false;
        }
      });
    }
  }
}