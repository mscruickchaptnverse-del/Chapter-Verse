import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';


import { ContactComponent } from './page/contact/contact.component';
import { ChangePasswordComponent } from './page/change-password/change-password.component';
import { EditorComponent } from './page/editor/editor.component';
import { HomeComponent } from './page/home/home.component';
import { SignInComponent } from './page/sign-in/sign-in.component';
import { adminSiteGuard } from './guards/admin-site.guard';
import { authGuard } from './guards/auth.guard';
import { publicSiteGuard } from './guards/public-site.guard';

const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [publicSiteGuard] },
  { path: 'contact', component: ContactComponent, canActivate: [publicSiteGuard] },
  { path: 'sign-in', component: SignInComponent, canActivate: [adminSiteGuard] },
  { path: 'editor', component: EditorComponent, canActivate: [adminSiteGuard, authGuard] },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [adminSiteGuard, authGuard] },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
