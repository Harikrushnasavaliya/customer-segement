import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegestrationComponent } from './regestration.component';

describe('RegestrationComponent', () => {
  let component: RegestrationComponent;
  let fixture: ComponentFixture<RegestrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegestrationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegestrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
