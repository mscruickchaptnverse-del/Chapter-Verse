import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';


import { ContactComponent } from './page/contact/contact.component';
import { ChangePasswordComponent } from './page/change-password/change-password.component';
import { EditorComponent } from './page/editor/editor.component';
import { HomeComponent } from './page/home/home.component';
import { SignInComponent } from './page/sign-in/sign-in.component';
import { authGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'editor', component: EditorComponent, canActivate: [authGuard] },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [authGuard] },
  { path: 'sign-in', component: SignInComponent },
  { path: 'contact', component: ContactComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
