import { type ReactNode } from "react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
    key: string;
    header: ReactNode;
    cell: (row: T) => ReactNode;
    className?: string;
};

type DataTableProps<T> = {
    rows: T[];
    columns: DataTableColumn<T>[];
    getRowKey: (row: T) => string;
    emptyState?: ReactNode;
    className?: string;
};

export function DataTable<T>({ rows, columns, getRowKey, emptyState, className }: DataTableProps<T>) {
    if (rows.length === 0 && emptyState) {
        return <>{emptyState}</>;
    }

    return (
        <div className={cn("overflow-hidden rounded-2xl border border-slate-200 bg-white", className)}>
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((column) => (
                            <TableHead key={column.key} className={column.className}>
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={getRowKey(row)}>
                            {columns.map((column) => (
                                <TableCell key={column.key} className={column.className}>
                                    {column.cell(row)}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
