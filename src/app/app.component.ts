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

  /** URL für Shell: Sidebar ausblenden auf /login und /register */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly showAppShell = computed(() => {
    const path = (this.currentUrl() ?? '').split('?')[0];
    return path !== '/login' && path !== '/register';
  });

  title = 'mobfit';
}
