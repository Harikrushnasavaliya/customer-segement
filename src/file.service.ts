import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  constructor(
    private firestore: AngularFirestore,
    private storage: AngularFireStorage
  ) { }

  // Get data from Firestore 'users' collection
  getData(): Observable<any[]> {
    return this.firestore.collection('users').valueChanges();
  }

  // Upload a file to Firebase Storage
  uploadFile(file: File, userId: string): Observable<string> {
    const filePath = `uploads/${userId}/${file.name}`; // File path in Storage
    const fileRef = this.storage.ref(filePath); // Reference to the file
    const uploadTask = this.storage.upload(filePath, file); // Upload task

    return new Observable<string>((observer) => {
      uploadTask
        .snapshotChanges()
        .pipe(
          finalize(() => {
            // Get the download URL after the file is uploaded
            fileRef.getDownloadURL().subscribe((url) => {
              // Save file metadata in Firestore
              this.firestore.collection('files').add({
                userId,
                fileName: file.name,
                fileUrl: url,
                uploadedAt: new Date(),
              });
              observer.next(url); // Emit the file URL
              observer.complete(); // Complete the observable
            });
          })
        )
        .subscribe();
    });
  }

  // Get all files uploaded by a specific user
  getUserFiles(userId: string): Observable<any[]> {
    return this.firestore
      .collection('files', (ref) => ref.where('userId', '==', userId))
      .valueChanges();
  }
}
