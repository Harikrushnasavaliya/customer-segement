import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, onAuthStateChanged } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private auth: Auth) { }

  // Login Method
  login(email: string, password: string): Promise<User> {
    return signInWithEmailAndPassword(this.auth, email, password).then((credential) => credential.user);
  }

  // Logout Method
  logout(): Promise<void> {
    return signOut(this.auth);
  }

  // Register Method
  register(email: string, password: string): Promise<User> {
    return createUserWithEmailAndPassword(this.auth, email, password).then((credential) => credential.user);
  }

  // Get Current User
  getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      onAuthStateChanged(this.auth, (user) => resolve(user));
    });
  }
}
