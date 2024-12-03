import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';
import * as FileSaver from 'file-saver';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { kmeans } from 'ml-kmeans';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { finalize } from 'rxjs/operators';
import { collection, getDocs } from '@angular/fire/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { AngularFireStorage } from '@angular/fire/compat/storage';

type ChartType = 'bar' | 'line' | 'scatter' | 'bubble' | 'pie' | 'doughnut' | 'polarArea' | 'radar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ChartModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {
  fileData: any[] = [];
  columns: string[] = [];
  chartData: any = null;
  filteredData: any[] = [];
  clusterResults: any = null;
  chartOptions: any = null;
  selectedFilters: { primary: string | null; secondary: string | null; tertiary: string | null } = {
    primary: null,
    secondary: null,
    tertiary: null,
  };
  graphTypes: ChartType[] = ['bar', 'line', 'pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble'];
  selectedGraphs: ChartType[] = ['bar', 'line', 'pie', 'doughnut'];
  currentSortColumn: string | null = null;
  sortOrder: 'asc' | 'desc' = 'asc';
  secondaryDropdownOptions: string[] = [];
  tertiaryDropdownOptions: string[] = [];
  quaternaryDropdownOptions: string[] = [];
  selectedSecondaryValue: string | null = null;
  selectedTertiaryValue: string | null = null;
  selectedQuaternaryValue: string | null = null;
  primaryColumnSelected: boolean = false;
  secondaryColumnSelected: boolean = false;
  uploadedFiles: any[] = []; // For storing Firebase uploaded file metadata

  form: FormGroup = new FormGroup({
    labelColumn: new FormControl(''),
    valueColumn: new FormControl(''),
    secondaryColumn: new FormControl(''),
    tertiaryColumn: new FormControl(''),
  });
  firestore: AngularFirestore;
  storage: AngularFireStorage;
  constructor(firestore: AngularFirestore, storage: AngularFireStorage) {
    this.firestore = firestore;
    this.storage = storage;

    console.log('Firestore initialized:', this.firestore);
    console.log('Storage initialized:', this.storage);
  }
  uploadFile(file: File) {
    const storage = getStorage();
    const fileRef = ref(storage, `uploads/${file.name}`);
    uploadBytes(fileRef, file).then((snapshot) => {
      console.log('File uploaded successfully:', snapshot);
      getDownloadURL(fileRef).then((url) => {
        console.log('File URL:', url);
      });
    });
  }
  get labelColumn(): FormControl {
    return this.form.get('labelColumn') as FormControl;
  }

  get valueColumn(): FormControl {
    return this.form.get('valueColumn') as FormControl;
  }

  ngOnInit() {
    console.log('Dashboard loaded!');
    this.loadUploadedFiles();
    this.chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return `${context.label}: ${context.raw}`;
            },
          },
        },
      },
      onClick: (event: any, elements: any[]) => {
        this.onChartClick({ event, elements });
      },
    };
    const storage = getStorage();
    const storageRef = ref(storage, 'your-file-path');
    getDownloadURL(storageRef)
      .then((url) => {
        console.log('File URL:', url);
      })
      .catch((error) => {
        console.error('Error fetching file:', error);
      });

  }

  onChartClick(event: any) {
    const elements = event.elements;

    if (elements && elements.length > 0) {
      const chartElementIndex = elements[0].index;
      const clickedLabel = this.chartData.labels[chartElementIndex];

      const labelColumn = this.form.controls['labelColumn'].value;

      // Match with clustering results if clustering is applied
      const filteredData = this.clusterResults
        ? this.clusterResults
          .filter((result: any) => result.cluster === chartElementIndex)
          .map((result: any) => this.fileData[result.index])
        : this.fileData.filter((row) => row[labelColumn] === clickedLabel);

      if (filteredData.length > 0) {
        this.exportToExcel(filteredData, `${clickedLabel}_Data`);
      } else {
        console.warn(`No data found for label: ${clickedLabel}`);
      }
    }
  }
  updateChartType(index: number, target: EventTarget | null) {
    const newType = (target as HTMLSelectElement)?.value as ChartType;
    if (newType) {
      this.selectedGraphs[index] = newType;
    }
  }
  loadUploadedFiles() {
    this.firestore
      .collection('files')
      .valueChanges()
      .subscribe((files: any[]) => {
        this.uploadedFiles = files;
      });
  }

  uploadFileToFirebase(file: File) {
    const filePath = `uploads/${file.name}`;
    const fileRef = this.storage.ref(filePath);
    const uploadTask = this.storage.upload(filePath, file);

    uploadTask
      .snapshotChanges()
      .pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe((url) => {
            const fileMetadata = {
              name: file.name,
              url,
              uploadedAt: new Date(),
            };
            this.firestore.collection('files').add(fileMetadata);
            this.loadUploadedFiles(); // Refresh uploaded files
          });
        })
      )
      .subscribe();
  }


  onFileUpload(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let file of files) {
        this.uploadFileToFirebase(file); // Upload to Firebase
        this.processFile(file); // Process for charting
      }
      event.target.value = ''; // Reset file input
    }
  }

  processFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = e.target.result;
      try {
        if (file.name.endsWith('.csv')) {
          this.parseCSV(data);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          this.parseExcel(data);
        } else {
          console.error('Unsupported file type:', file.name);
        }
      } catch (error) {
        console.error('Error processing file:', error);
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  }


  parseCSV(data: string) {
    Papa.parse(data, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<any>) => {
        this.fileData = [...this.fileData, ...results.data];
        this.initializeColumns();
        this.generateChartData();
        this.applyKMeansClustering();
      },
    });
  }

  parseExcel(data: any) {
    const workbook = XLSX.read(data, { type: 'binary' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);
    this.fileData = [...this.fileData, ...jsonData];
    this.initializeColumns();
    this.generateChartData();
    this.applyKMeansClustering();
  }

  initializeColumns() {
    if (this.fileData.length > 0) {
      this.columns = Object.keys(this.fileData[0]);
      if (!this.labelColumn.value) {
        this.labelColumn.setValue(this.columns[0]);
      }
      if (!this.valueColumn.value) {
        this.valueColumn.setValue(this.columns[1]);
      }
    }
  }

  generateChartData() {
    const labelColumn = this.labelColumn.value;
    const valueColumn = this.valueColumn.value;
    if (!labelColumn || !valueColumn) {
      this.chartData = null;
      return;
    }

    const aggregatedData: any = {};
    const groupedData: { [key: string]: any[] } = {};
    this.fileData.forEach((row) => {
      const label = row[labelColumn];
      const value = parseFloat(row[valueColumn]) || 0;
      aggregatedData[label] = (aggregatedData[label] || 0) + value;
      if (!groupedData[label]) {
        groupedData[label] = [];
      }
      groupedData[label].push(row);
    });

    this.chartData = {
      labels: Object.keys(aggregatedData),
      datasets: [
        {
          label: `${valueColumn} by ${labelColumn}`,
          data: Object.values(aggregatedData),
          backgroundColor: [
            '#42A5F5',
            '#66BB6A',
            '#FFA726',
            '#AB47BC',
            '#EC407A',
            '#7E57C2',
            '#26A69A',
            '#FF7043',
          ],
        },
      ],
    };

    this.filteredData = Object.values(groupedData).flat();
  }

  applyKMeansClustering() {
    const valueColumn = this.valueColumn.value;
    if (!valueColumn || this.fileData.length === 0) {
      console.warn('Cannot apply clustering without valid data.');
      return;
    }
    const clusteringData = this.fileData.map((row) => [parseFloat(row[valueColumn]) || 0]);
    const k = 3; // Number of clusters
    try {
      const results = kmeans(clusteringData, k);
      this.clusterResults = results.clusters.map((cluster: number, index: number) => ({
        index,
        cluster,
        value: clusteringData[index][0],
      }));
      console.log('Clustering Results:', this.clusterResults);
    } catch (error) {
      console.error('Error in k-means clustering:', error);
    }
  }

  downloadFilteredData(clickedLabel: string) {
    const labelColumn = this.labelColumn.value;
    const filteredData = this.fileData.filter((row) => row[labelColumn] === clickedLabel);

    if (filteredData.length > 0) {
      this.exportToExcel(filteredData, `${clickedLabel}_Data`);
    } else {
      console.warn(`No data found for label: ${clickedLabel}`);
    }
  }

  exportToExcel(data: any[], filename: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const fileData = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    FileSaver.saveAs(fileData, `${filename}_${new Date().getTime()}.xlsx`);
  }

  downloadEachSeparatedFile() {
    const labelColumn = this.form.controls['labelColumn'].value;
    const groupedData: { [key: string]: any[] } = {};
    this.fileData.forEach((row) => {
      const label = row[labelColumn];
      if (!groupedData[label]) {
        groupedData[label] = [];
      }
      groupedData[label].push(row);
    });
    Object.keys(groupedData).forEach((label) => {
      this.exportToExcel(groupedData[label], `${label}_Data`);
    });
  }

  downloadAllSeparatedData() {
    const labelColumn = this.form.controls['labelColumn'].value;
    const groupedData: { [key: string]: any[] } = {};
    this.fileData.forEach((row) => {
      const label = row[labelColumn];
      if (!groupedData[label]) {
        groupedData[label] = [];
      }
      groupedData[label].push(row);
    });
    const workbook = XLSX.utils.book_new();
    Object.keys(groupedData).forEach((label) => {
      const worksheet = XLSX.utils.json_to_sheet(groupedData[label]);
      XLSX.utils.book_append_sheet(workbook, worksheet, label);
    });
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    FileSaver.saveAs(data, `SeparatedData_${new Date().getTime()}.xlsx`);
  }

  downloadAllDataSingleSheet() {
    const labelColumn = this.form.controls['labelColumn'].value;
    const sortedData = [...this.fileData].sort((a, b) => {
      const labelA = a[labelColumn];
      const labelB = b[labelColumn];
      return labelA < labelB ? -1 : labelA > labelB ? 1 : 0;
    });
    const worksheet = XLSX.utils.json_to_sheet(sortedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sorted Data');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    FileSaver.saveAs(data, `SortedData_${new Date().getTime()}.xlsx`);
  }

  sortTable(column: string) {
    if (this.currentSortColumn === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSortColumn = column;
      this.sortOrder = 'asc';
    }
    this.filteredData.sort((a, b) => {
      const valueA = a[column];
      const valueB = b[column];

      if (valueA < valueB) {
        return this.sortOrder === 'asc' ? -1 : 1;
      } else if (valueA > valueB) {
        return this.sortOrder === 'asc' ? 1 : -1;
      } else {
        return 0;
      }
    });
  }
}
