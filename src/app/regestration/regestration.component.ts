import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Required for standalone components
import { ReactiveFormsModule } from '@angular/forms'; // Reactive forms support
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service'; // Import your auth service

@Component({
  selector: 'app-regestration',
  standalone: true,
  imports: [
    CommonModule,
    InputTextModule,
    ButtonModule,
    PasswordModule,
    ReactiveFormsModule,
  ],
  templateUrl: './regestration.component.html',
  styleUrls: ['./regestration.component.css'],
})
export class RegestrationComponent implements OnInit {
  registrationForm!: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService // Use the AuthService for Firebase
  ) { }

  ngOnInit() {
    this.registrationForm = this.fb.group(
      {
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  // Custom Validator to match passwords
  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  onRegister() {
    if (this.registrationForm.valid) {
      const { email, password } = this.registrationForm.value;

      this.authService
        .register(email, password) // Call the AuthService to register
        .then(() => {
          console.log('Registration successful');
          this.router.navigate(['/login']); // Navigate to login page
        })
        .catch((error) => {
          console.error('Registration failed:', error);
          this.errorMessage = error.message; // Show error message
        });
    }
  }
}