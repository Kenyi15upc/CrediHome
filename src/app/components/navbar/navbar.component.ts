import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  isAsesor = false;
  isCliente = false;
  username: string | null = null;

  private userSubscription!: Subscription;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser.subscribe(user => {
      this.isLoggedIn = !!user;

      if (user && user.roles) {
        this.username = user.sub;
        this.isAsesor = user.roles.includes('ROLE_ASESOR');
        this.isCliente = user.roles.includes('ROLE_CLIENTE');
      } else {
        // Si no hay usuario o el objeto no tiene la propiedad 'roles', reseteamos todo a false.
        this.username = null;
        this.isAsesor = false;
        this.isCliente = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}
