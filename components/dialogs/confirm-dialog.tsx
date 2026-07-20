"use client";

import { type ReactNode } from "react";

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: ReactNode;
    children?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
};

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    children,
    confirmLabel = "Bestätigen",
    cancelLabel = "Abbrechen",
    destructive = false,
    onConfirm,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-2xl bg-white">
                <DialogHeader>
                    <DialogTitle className="text-lg font-extrabold text-slate-950">{title}</DialogTitle>
                    {description ? <DialogDescription>{description}</DialogDescription> : null}
                </DialogHeader>
                {children}
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            {cancelLabel}
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        variant={destructive ? "destructive" : "default"}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
