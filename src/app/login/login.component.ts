import { Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { CommonModule } from '@angular/common';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AngularFireAuthModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})

export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true; // Start loading
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).then(
        (user) => {
          console.log('Login successful:', user);
          this.ngZone.run(() => {
            // debugger
            this.router.navigate(['/dashboard']).then(() => {
              console.log('Navigated to /dashboard');
              this.isLoading = false; // Stop loading
            });
          });
        },
        (error) => {
          console.error('Login failed:', error);
          this.isLoading = false; // Stop loading
          switch (error.code) {
            case 'auth/user-not-found':
              alert('No user found with this email.');
              break;
            case 'auth/wrong-password':
              alert('Incorrect password.');
              break;
            case 'auth/too-many-requests':
              alert('Too many login attempts. Please try again later.');
              break;
            default:
              alert('Login failed. Please try again.');
          }
        }
      );
    }
  }

  navigateToRegister() {
    console.log('Navigating to Register...');
    this.router.navigate(['/register']).catch((err) => console.error('Navigation to Register failed:', err));
  }

  forgotpassword() {
    this.router.navigate(['/forgot-password']).catch((err) => console.error('Navigation to Forgot Password failed:', err));
  }
}
