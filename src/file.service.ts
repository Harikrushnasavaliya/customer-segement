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

  getData(): Observable<any[]> {
    return this.firestore.collection('users').valueChanges();
  }

  uploadFile(file: File, userId: string): Observable<string> {
    const filePath = `uploads/${userId}/${file.name}`;
    const fileRef = this.storage.ref(filePath);
    const uploadTask = this.storage.upload(filePath, file);

    return new Observable<string>((observer) => {
      uploadTask
        .snapshotChanges()
        .pipe(
          finalize(() => {
            fileRef.getDownloadURL().subscribe((url) => {
              this.firestore.collection('files').add({
                userId,
                fileName: file.name,
                fileUrl: url,
                uploadedAt: new Date(),
              });
              observer.next(url);
              observer.complete();
            });
          })
        )
        .subscribe();
    });
  }

  getUserFiles(userId: string): Observable<any[]> {
    return this.firestore
      .collection('files', (ref) => ref.where('userId', '==', userId))
      .valueChanges();
  }
}
