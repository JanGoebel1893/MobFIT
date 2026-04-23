import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-side-nav-bar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './side-nav-bar.component.html',
  styleUrl: './side-nav-bar.component.css',
})
export class SideNavBarComponent implements OnInit {
  userName = signal('MobFit User');
  userSubtitle = signal('');

  constructor(private supabase: SupabaseService) {}

  async ngOnInit(): Promise<void> {
    const user = await this.supabase.getUser();
    if (!user) return;

    const { data } = await this.supabase.getProfile(user.id);
    if (!data) return;

    this.userName.set(data.username);
    this.userSubtitle.set(`${data.age}yo • ${data.height}cm`);
  }
}
