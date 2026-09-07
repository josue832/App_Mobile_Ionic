import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular';
import { animate } from 'animejs';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class Tab1Page {

  @ViewChild('animatedPath') pathRef!: ElementRef<SVGPathElement>;

  private current: any = null;

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
}