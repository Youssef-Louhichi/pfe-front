import { Rapport } from "./rapport";

export class Graph {
    constructor(public id: number,public headers: string[],public data: any[],public format: string,
        public height: number,public width: number,
        public leftpos: number,public toppos: number,
        public columnX: string,public columnY: string,
        public colors: string[],public chartType: string,
        public rapport: Rapport
    ) {}
}
