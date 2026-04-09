import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit, OnDestroy {
  username = '';
  password = '';
  age: number | null = null;
  heightCm: number | null = null;
  agreeTerms = false;

  private prevHtmlOverflow = '';
  private prevBodyOverflow = '';

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
    // Registrierungs-API folgt
  }
}
