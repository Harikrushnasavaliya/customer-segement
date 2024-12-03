import { Injectable } from '@angular/core';
// import {
//   Auth,
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   signOut,
//   User,
//   onAuthStateChanged,
//   getAuth,
// } from '@angular/fire/auth';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';



@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private afAuth: AngularFireAuth,
    private auth: Auth
  ) { }

  login(email: string, password: string): Promise<any> {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }
  // login(email: string, password: string): Promise<any> {
  //   const auth = getAuth();
  //   return signInWithEmailAndPassword(auth, email, password);
  // }

  logout() {
    return signOut(this.auth);
  }

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      onAuthStateChanged(this.auth, (user) => {
        resolve(user);
      });
    });
  }
}
