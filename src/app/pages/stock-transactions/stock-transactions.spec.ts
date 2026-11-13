import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StockTransactions } from './stock-transactions';

describe('StockTransactions', () => {
  let component: StockTransactions;
  let fixture: ComponentFixture<StockTransactions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockTransactions],
    }).compileComponents();

    fixture = TestBed.createComponent(StockTransactions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
