import { Device } from '../../models/device.model';
import { DevicesService } from './../../services/devices.service';
import { Component, OnDestroy, OnInit, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, of } from 'rxjs';
import {
  takeUntil,
  finalize,
  catchError,
  tap,
  switchMap,
} from 'rxjs/operators';
import { isXlsxFile } from '../../../../../core/utils/form-validators.utils';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-device-bulk-upload-modal',
  templateUrl: './device-bulk-upload-modal.component.html',
  styleUrls: ['./device-bulk-upload-modal.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class DeviceBulkUploadModalComponent implements OnInit, OnDestroy {
  // Outputs para comunicar el resultado de la carga masiva y el cierre del modal
  @Output() uploaded = new EventEmitter<Device[]>();
  @Output() close = new EventEmitter<void>();

  // Estado del formulario, carga y error
  loading = false;
  formError = '';
  form!: FormGroup;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private devicesService: DevicesService,
    private fb: FormBuilder,
  ) {}

  ngOnInit() {
    this.initForm();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm() {
    this.form = this.fb.group({
      file: [null, [Validators.required, this.xlsxFileValidator]],
    });
  }

  xlsxFileValidator = (control: any) => {
    const file = control.value as File;
    if (!file) return null;
    return isXlsxFile(file)
      ? null
      : { invalidFileType: 'El archivo debe ser .xls o .xlsx' };
  };

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.form.get('file')!.setValue(file);
      this.form.get('file')!.markAsTouched();
      this.formError = '';
    }
  }

  uploadDevices() {
    if (this.form.invalid) {
      this.formError = 'Debe seleccionar un archivo válido (.xlsx o .xls)';
      return;
    }

    this.loading = true;
    this.formError = '';
    const file: File = this.form.get('file')!.value;

    of(null)
      .pipe(
        switchMap(() =>
          this.devicesService.uploadBulkDevices(file).pipe(
            tap((devices) => {
              this.uploaded.emit(devices);
              toast.success(
                `${devices.length} dispositivos cargados exitosamente`,
              );
            }),
            catchError((err) => {
              const msg =
                err?.error?.message ||
                err?.message ||
                'Error al guardar el dispositivo';

              this.formError = msg;
              toast.error('Error al guardar el dispositivo', {
                description: msg,
              });
              return of([]); // Para terminar el stream
            }),
          ),
        ),
        finalize(() => (this.loading = false)),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  closeModal() {
    this.close.emit();
  }

  get fileErrorMsg(): string | null {
    const control = this.form.get('file');
    if (control?.hasError('invalidFileType'))
      return control.getError('invalidFileType');
    if (control?.hasError('required')) return 'Debe seleccionar un archivo';
    return null;
  }
}
