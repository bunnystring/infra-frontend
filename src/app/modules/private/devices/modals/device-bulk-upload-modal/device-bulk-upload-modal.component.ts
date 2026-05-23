import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { of, switchMap, tap, catchError, finalize } from 'rxjs';
import { Device } from '../../models/device.model';
import { DevicesService } from '../../services/devices.service';
import { isXlsxFile } from '../../../../../core/utils/form-validators.utils';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-device-bulk-upload-modal',
  templateUrl: './device-bulk-upload-modal.component.html',
  styleUrls: ['./device-bulk-upload-modal.component.css'],
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceBulkUploadModalComponent {
  private readonly devicesService = inject(DevicesService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly uploaded = output<Device[]>();
  readonly close = output<void>();

  readonly loading = signal(false);
  readonly formError = signal('');

  private readonly xlsxFileValidator = (control: { value: File | null }) => {
    const file = control.value;
    if (!file) return null;
    return isXlsxFile(file) ? null : { invalidFileType: 'El archivo debe ser .xls o .xlsx' };
  };

  readonly form: FormGroup = this.fb.group({
    file: [null, [Validators.required, this.xlsxFileValidator]],
  });

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.form.get('file')!.setValue(file);
      this.form.get('file')!.markAsTouched();
      this.formError.set('');
    }
  }

  uploadDevices(): void {
    if (this.form.invalid) {
      this.formError.set('Debe seleccionar un archivo válido (.xlsx o .xls)');
      return;
    }

    this.loading.set(true);
    this.formError.set('');
    const file: File = this.form.get('file')!.value;

    of(null)
      .pipe(
        switchMap(() =>
          this.devicesService.uploadBulkDevices(file).pipe(
            tap((devices) => {
              this.uploaded.emit(devices);
              toast.success(`${devices.length} dispositivos cargados exitosamente`);
            }),
            catchError((err) => {
              const msg = err?.error?.message || err?.message || 'Error al cargar los dispositivos';
              this.formError.set(msg);
              toast.error('Error al cargar los dispositivos', { description: msg });
              return of([]);
            }),
          ),
        ),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  closeModal(): void {
    this.close.emit();
  }

  get fileErrorMsg(): string | null {
    const control = this.form.get('file');
    if (control?.hasError('invalidFileType')) return control.getError('invalidFileType');
    if (control?.hasError('required')) return 'Debe seleccionar un archivo';
    return null;
  }
}
