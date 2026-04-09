import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
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

  /** Mindestlänge Passwort (Anzeige + Validierung) */
  readonly passwordMinLength = 8;

  get isRegisterFormValid(): boolean {
    const user = this.username.trim();
    const mail = this.email.trim();
    const pass = this.password;
    if (!user || !mail || !pass || pass.length < this.passwordMinLength) {
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

  constructor(private supabase: SupabaseService) {}

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
    try {
      await this.supabase.signUp(
        "test@test.com", this.password,
        this.username, this.age!, this.heightCm!
      );
    } catch(error) {
      console.error("Error:", error);
    }
  }
}
