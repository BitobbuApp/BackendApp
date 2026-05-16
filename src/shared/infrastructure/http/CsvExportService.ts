import { format, FormatterOptionsArgs } from 'fast-csv';

export class CsvExportService {
    static createCsvStream<T extends object>(options?: FormatterOptionsArgs<T, T>) {
        return format<T, T>({
            headers: true,
            quoteColumns: true,
            ...options,
        });
    }
}
