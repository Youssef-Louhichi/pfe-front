import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ScriptServiceService } from 'src/app/services/script-service.service';
@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit{


  allResults: { headers: string[], rows: any[] }[] = [];

  constructor(private scriptService: ScriptServiceService,private route: ActivatedRoute) {}
  ngOnInit(): void {
    const scriptId = this.route.snapshot.paramMap.get('scriptId');
    if (scriptId) {
      this.fetchResults(Number(scriptId)); // Convert string to number
    }
  }

  fetchResults(scriptId: number): void {
    this.scriptService.executeScript(scriptId).subscribe(
      (result: any[][]) => {
        this.allResults = result.map(queryResult => {
          const headers = queryResult.length > 0 ? Object.keys(queryResult[0]) : [];
          return {
            headers,
            rows: queryResult
          };
        });
      },
      error => {
        console.error('Error fetching results:', error);
      }
    );
  }

}
