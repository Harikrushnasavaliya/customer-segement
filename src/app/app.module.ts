import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { environment } from '../environments/environment';

@NgModule({
    declarations: [
        // Declare AppComponent if not standalone
    ],
    imports: [
        BrowserModule,
        RouterModule.forRoot(routes), // Define routes for navigation
    ],
    providers: [
        provideFirebaseApp(() => initializeApp(environment.firebase)), // Firebase App initialization
        provideAuth(() => getAuth()), // Firebase Authentication
        provideFirestore(() => getFirestore()), // Firebase Firestore
        provideStorage(() => getStorage()), // Firebase Storage
    ],
    bootstrap: [], // Specify AppComponent as the root component
})
export class AppModule { }
