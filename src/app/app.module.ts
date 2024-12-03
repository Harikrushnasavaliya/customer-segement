import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';

@NgModule({
    declarations: [
    ],
    imports: [
        AppComponent,
        BrowserModule,
        RouterModule.forRoot(routes),
    ],
    bootstrap: [],
})
export class AppModule { }
