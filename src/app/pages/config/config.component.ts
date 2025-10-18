import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ThemeService } from '../../services/theme.service';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PlatformCardComponent } from '../../shared/components/platform-card/platform-card.component';
import { ConfigurationService } from '../../services/configuration.service';
import { AnyConfigs } from '../../shared/models/social-platforms.model';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatCardModule,
    MatDividerModule,
    FlexLayoutModule,
    PlatformCardComponent,
  ],
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss'],
})
export class ConfigComponent {
  themeService = inject(ThemeService);
  private configurationService = inject(ConfigurationService);
  private snackBar = inject(MatSnackBar);

  configs$: Observable<AnyConfigs[] | null>;
  localConfigs: AnyConfigs[] = [];

  constructor() {
    this.configs$ = this.configurationService.getConfigurations();
  }

  onThemeChange(isDark: boolean): void {
    this.themeService.isDarkTheme.set(isDark);
  }

  ngOnInit(): void {
    this.configs$.subscribe((configs) => {
      this.localConfigs = configs ? JSON.parse(JSON.stringify(configs)) : [];
    });
  }

  onSave(): void {
    this.configurationService.saveConfigurations(this.localConfigs).subscribe(() => {
      this.snackBar.open('Configurações salvas com sucesso!', 'OK', { duration: 3000 });
    });
  }

  onCancel(): void {
    this.ngOnInit();
    this.snackBar.open('Alterações descartadas.', 'OK', { duration: 2000 });
  }
}
