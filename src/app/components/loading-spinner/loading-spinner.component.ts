import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.css']
})
export class LoadingSpinnerComponent {

  @Input() size: string = '50px';
  @Input() thickness: string = '4px';
  @Input() color: string = '#f3f3f3';
  @Input() primaryColor: string = '#3498db';
  @Input() speed: string = '1s';
  @Input() text: string = 'Loading...';
  @Input() textColor: string = '#666';
  @Input() textSize: string = '1rem';
  @Input() showText: boolean = true;

}
