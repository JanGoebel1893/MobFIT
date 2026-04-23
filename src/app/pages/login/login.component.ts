import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit, OnDestroy {
  email = '';
  username = '';
  password = '';
  remember = false;
  errorMessage = '';
  isLoading = false;

  private prevHtmlOverflow = '';
  private prevBodyOverflow = '';

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.prevHtmlOverflow = document.documentElement.style.overflow;
    this.prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    document.documentElement.style.overflow = this.prevHtmlOverflow;
    document.body.style.overflow = this.prevBodyOverflow;
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.errorMessage = '';
    this.isLoading = true;

    try {
      await this.supabase.signIn(this.email, this.password, true);
      this.router.navigate(['/health']);
    } catch (error: any) {
      this.errorMessage = 'Login fehlgeschlagen. Bitte Email und Passwort prüfen.';
      console.error('Login error:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
