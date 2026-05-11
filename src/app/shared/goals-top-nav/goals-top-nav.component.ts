import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { LogOutIcon } from 'lucide-angular/src/icons';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-goals-top-nav',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './goals-top-nav.component.html',
  styleUrl: './goals-top-nav.component.css',
})
export class GoalsTopNavComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);

  /** Titelzeile (nicht `title` nennen – Kollision mit HTML-Attribut) */
  pageTitle = input('Dashboard');

  /** Nur bei Supabase-Session: Logout sinnvoll (z. B. nicht auf Impressum als Gast) */
  isAuthenticated = signal(false);
  readonly icons = { LogOut: LogOutIcon };

  async ngOnInit(): Promise<void> {
    const user = await this.supabase.getUser();
    this.isAuthenticated.set(!!user);
  }
}
