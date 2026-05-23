import { TestBed, ComponentFixture } from '@angular/core/testing';
import { OrderDeleteModalComponent } from './order-delete-modal.component';
import { Order, OrderStates } from '../../models/orders.model';

const mockOrder: Order = {
  id: 'order-1',
  description: 'Instalación de equipos banco',
  state: OrderStates.CREATED,
  assigneeType: 'GROUP',
  assigneeId: 'group-1',
  createdAt: '2026-01-01T00:00:00',
  updatedAt: '2026-01-01T00:00:00',
  items: [],
  assignee: null,
};

describe('OrderDeleteModalComponent', () => {
  let component: OrderDeleteModalComponent;
  let fixture: ComponentFixture<OrderDeleteModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDeleteModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDeleteModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe ser creado', () => {
    expect(component).toBeTruthy();
  });

  // ── Estado inicial ────────────────────────────────────────────────────────
  it('loading inicia en false', () => {
    expect(component.loading()).toBe(false);
  });

  it('error inicia como cadena vacía', () => {
    expect(component.error()).toBe('');
  });

  it('order inicia en null sin @Input', () => {
    expect(component.order()).toBeNull();
  });

  // ── input order ───────────────────────────────────────────────────────────
  describe('input order', () => {
    it('refleja la orden asignada por input', async () => {
      fixture.componentRef.setInput('order', mockOrder);
      await fixture.whenStable();
      expect(component.order()).toEqual(mockOrder);
    });

    it('expone la descripción de la orden asignada', () => {
      fixture.componentRef.setInput('order', mockOrder);
      expect(component.order()?.description).toBe('Instalación de equipos banco');
    });

    it('acepta null como valor de input', () => {
      fixture.componentRef.setInput('order', null);
      expect(component.order()).toBeNull();
    });
  });

  // ── cancelDelete ──────────────────────────────────────────────────────────
  describe('cancelDelete', () => {
    it('emite el evento cancel', () => {
      const emitSpy = vi.spyOn(component.cancel, 'emit');
      component.cancelDelete();
      expect(emitSpy).toHaveBeenCalled();
    });

    it('no emite el evento deleted al cancelar', () => {
      const emitSpy = vi.spyOn(component.deleted, 'emit');
      component.cancelDelete();
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  // ── @Output events ────────────────────────────────────────────────────────
  describe('@Output events', () => {
    it('deleted es un OutputEmitter', () => {
      expect(component.deleted).toBeDefined();
      expect(typeof component.deleted.emit).toBe('function');
    });

    it('cancel es un OutputEmitter', () => {
      expect(component.cancel).toBeDefined();
      expect(typeof component.cancel.emit).toBe('function');
    });
  });
});
