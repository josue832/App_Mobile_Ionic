import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular';
import { animate } from 'animejs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, FormsModule, CommonModule],
})
export class LoginPage {

  @ViewChild('animatedPath') pathRef!: ElementRef<SVGPathElement>;

  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  private current: any = null;

  constructor(private authService: AuthService, private router: Router) {}

  private animatePath(strokeDashoffset: number, strokeDasharray: string): void {
    if (this.current) {
      this.current.pause();
    }
    this.current = animate(this.pathRef.nativeElement, {
      strokeDashoffset: {
        to: strokeDashoffset,
        duration: 700,
        ease: 'outQuart',
      },
      strokeDasharray: {
        to: strokeDasharray,
        duration: 700,
        ease: 'outQuart',
      },
    });
  }

  onFocusEmail(): void {
    this.animatePath(0, '240 1386');
  }

  onFocusPassword(): void {
    this.animatePath(-336, '240 1386');
  }

  onFocusSubmit(): void {
    this.animatePath(-730, '530 1386');
  }

  async onSubmit(): Promise<void> {
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Email y contraseña son obligatorios';
      return;
    }

    this.loading = true;
    const res = await this.authService.login(this.email, this.password);
    this.loading = false;

    if (res.success) {
      this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true });
    } else {
      this.errorMessage = res.message || 'No se pudo iniciar sesión';
    }
  }
}