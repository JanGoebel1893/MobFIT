import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideNavBarComponent } from './shared/side-nav-bar/side-nav-bar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SideNavBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'mobfit';
}
