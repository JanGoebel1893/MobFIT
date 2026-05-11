import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DEFAULT_AUTHENTICATED_ROUTE } from '../../core/auth.constants';
import { SupabaseService } from '../../services/supabase.service';
import { LucideAngularModule } from 'lucide-angular';
import { LockIcon, MailIcon, UserIcon } from 'lucide-angular/src/icons';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit, OnDestroy {
  username = '';
  email = '';
  password = '';
  age: number | null = null;
  heightCm: number | null = null;
  agreeTerms = false;
  isLoading = false;

  /** Mindestlänge Passwort (Anzeige + Validierung) */
  readonly passwordMinLength = 8;
  readonly icons = { User: UserIcon, Mail: MailIcon, Lock: LockIcon };

  get isRegisterFormValid(): boolean {
    const user = this.username.trim();
    const mail = this.email.trim();
    const pass = this.password;
    if (user.length < 2 || !mail || !pass || pass.length < this.passwordMinLength) {
      return false;
    }
    if (!this.isValidEmail(mail)) {
      return false;
    }
    if (this.age == null || Number.isNaN(this.age) || this.age < 1 || this.age > 120) {
      return false;
    }
    if (this.heightCm == null || Number.isNaN(this.heightCm) || this.heightCm < 50 || this.heightCm > 300) {
      return false;
    }
    if (!this.agreeTerms) {
      return false;
    }
    return true;
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

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

  onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.isRegisterFormValid) {
      return;
    }

    const form = event.currentTarget as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    this.onRegister();
  }

  async onRegister() {
    this.isLoading = true;

    try {
      await this.supabase.signUp(
        this.email, this.password,
        this.username, this.age!, this.heightCm!
      );
      await this.router.navigate([DEFAULT_AUTHENTICATED_ROUTE]);
    } catch(error: unknown) {
      console.error('Registrierung:', error);
      const msg = error instanceof Error ? error.message : 'Registrierung fehlgeschlagen.';
      alert(msg);
    } finally {
      this.isLoading = false;
    }
  }
}
