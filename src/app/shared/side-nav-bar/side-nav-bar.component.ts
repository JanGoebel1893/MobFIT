import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-side-nav-bar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './side-nav-bar.component.html',
  styleUrl: './side-nav-bar.component.css',
})
export class SideNavBarComponent {
  /** Anzeigename im Profilbereich unten */
  userName = input('MobFit Nutzer');
  /** Zweite Zeile (z. B. E-Mail oder Status) */
  userSubtitle = input('Profil');
}
