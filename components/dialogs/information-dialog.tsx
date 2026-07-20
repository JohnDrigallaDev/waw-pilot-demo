"use client";

import { type ReactNode } from "react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type InformationDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: ReactNode;
    children?: ReactNode;
};

export function InformationDialog({
    open,
    onOpenChange,
    title,
    description,
    children,
}: InformationDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg rounded-2xl bg-white">
                <DialogHeader>
                    <DialogTitle className="text-lg font-extrabold text-slate-950">{title}</DialogTitle>
                    {description ? <DialogDescription>{description}</DialogDescription> : null}
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}
