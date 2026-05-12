import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DEFAULT_AUTHENTICATED_ROUTE } from '../../core/auth.constants';
import { SupabaseService } from '../../services/supabase.service';
import { isValidEmailFormat } from '../../shared/utils/numeric-form.utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit, OnDestroy {
  email = '';
  password = '';
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

  get isLoginFormValid(): boolean {
    const mail = this.email.trim();
    return mail.length > 0 && isValidEmailFormat(mail) && this.password.length > 0;
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.errorMessage = '';
    if (!this.isLoginFormValid) {
      this.errorMessage = 'Bitte eine gültige E-Mail-Adresse und ein Passwort eingeben.';
      return;
    }
    this.isLoading = true;

    try {
      await this.supabase.signIn(this.email.trim(), this.password);
      await this.router.navigate([DEFAULT_AUTHENTICATED_ROUTE]);
    } catch (error: any) {
      this.errorMessage = 'Login fehlgeschlagen. Bitte Email und Passwort prüfen.';
      console.error('Login error:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
