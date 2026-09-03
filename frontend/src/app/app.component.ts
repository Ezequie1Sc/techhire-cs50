import { Component, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { PageTransitionService } from './core/services/page-transition.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'techhire-dashboard';

  constructor(private pageTransition: PageTransitionService) {}

  ngAfterViewInit(): void {
    this.pageTransition.playEnterTransition();
  }
}