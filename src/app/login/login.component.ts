import { Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

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
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).then(
        (user) => {
          console.log('Login successful:', user);
          this.ngZone.run(() => {
            this.router.navigate(['/dashboard']);
          });
        },
        (error) => {
          console.error('Login failed:', error);
        }
      );
    }
  }


  navigateToRegister() {
    console.log('Navigating to Register...');
    this.router.navigate(['/regester']);
  }

  forgotpassword() {
    this.router.navigate(['/forgot-password']);
  }
}
