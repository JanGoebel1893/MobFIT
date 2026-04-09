import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { SideNavBarComponent } from './shared/side-nav-bar/side-nav-bar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SideNavBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly router = inject(Router);

  /** URL für Shell: Sidebar ausblenden auf /login */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly showAppShell = computed(() => {
    const u = this.currentUrl() ?? '';
    return !u.split('?')[0].startsWith('/login');
  });

  title = 'mobfit';
}
